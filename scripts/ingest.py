import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))

import pandas as pd
import numpy as np
import hashlib
import pyTigerGraph as tg
from config import TG_HOST, TG_GRAPH_NAME, DATA_DIR, update_task, get_tg_connection

CHUNK_SIZE = 50_000


def connect():
    return get_tg_connection(TG_GRAPH_NAME)


def safe_str(series):
    return series.fillna("").astype(str).str.strip()


def build_card_id_map():
    print("Building card ID map from closed_cases + case_pack...")
    cases = pd.read_csv(DATA_DIR / "closed_cases_history.csv", low_memory=False)
    pack = pd.read_csv(DATA_DIR / "case_pack.csv", low_memory=False)

    known = {}
    for _, row in cases.iterrows():
        cid, card_id = row["customer_id"], row["card_id"]
        known.setdefault(cid, set()).add(card_id)
        for cc in str(row.get("connected_card_ids", "")).split("|"):
            cc = cc.strip()
            if cc and "-K" in cc:
                prefix = cc.split("-K")[0]
                known.setdefault(prefix, set()).add(cc)
    for _, row in pack.iterrows():
        cid, card_id = row["customer_id"], row["card_id"]
        known.setdefault(cid, set()).add(card_id)

    txn_cards = pd.read_csv(DATA_DIR / "transactions.csv", usecols=["customer_id", "card1"], low_memory=False)
    unique_combos = txn_cards.drop_duplicates().sort_values(["customer_id", "card1"])

    card_map = {}
    for cid, group in unique_combos.groupby("customer_id"):
        existing = sorted(known.get(cid, set()))
        card1_vals = group["card1"].tolist()

        if len(existing) == len(card1_vals):
            for card1, card_id in zip(card1_vals, existing):
                card_map[(cid, card1)] = card_id
        elif len(existing) > 0 and len(card1_vals) >= len(existing):
            for i, card1 in enumerate(card1_vals):
                if i < len(existing):
                    card_map[(cid, card1)] = existing[i]
                else:
                    card_map[(cid, card1)] = f"{cid}-K{i+1}"
        else:
            for i, card1 in enumerate(card1_vals):
                card_map[(cid, card1)] = f"{cid}-K{i+1}"

    print(f"  Mapped {len(card_map):,} (customer, card1) pairs to card IDs")
    return card_map


def hash_device(info, os_v, br, scr):
    raw = f"{info}|{os_v}|{br}|{scr}"
    return hashlib.md5(raw.encode()).hexdigest()[:12]


def ingest_transactions(conn, card_map):
    print("\nLoading identity.csv into memory for device linking...")
    id_df = pd.read_csv(DATA_DIR / "identity.csv", low_memory=False)
    id_df["TransactionID"] = id_df["TransactionID"].astype(str)
    id_df["DeviceInfo"] = safe_str(id_df["DeviceInfo"])
    id_df["id_30"] = safe_str(id_df["id_30"])
    id_df["id_31"] = safe_str(id_df["id_31"])
    id_df["id_33"] = safe_str(id_df["id_33"])
    id_df["DeviceType"] = safe_str(id_df["DeviceType"])
    id_df["id_15"] = safe_str(id_df["id_15"])

    # Compute device_id for rows that have DeviceInfo
    has_dev = id_df["DeviceInfo"] != ""
    dev_ids = [
        hash_device(r.DeviceInfo, r.id_30, r.id_31, r.id_33) if r.DeviceInfo else ""
        for r in id_df.itertuples()
    ]
    id_df["device_id"] = dev_ids
    id_dict = id_df.set_index("TransactionID").to_dict("index")
    print(f"  {len(id_dict):,} identity rows indexed")

    print("\nStreaming transactions.csv in chunks of 50,000...")
    total_txns = 0
    chunk_idx = 0
    prev_by_card = {}

    reader = pd.read_csv(DATA_DIR / "transactions.csv", chunksize=CHUNK_SIZE, low_memory=False)

    for chunk in reader:
        chunk_idx += 1
        chunk_len = len(chunk)
        print(f"  [Chunk {chunk_idx}] Processing {chunk_len:,} rows...")

        chunk["txn_id"] = chunk["TransactionID"].astype(str)
        chunk["customer_id"] = safe_str(chunk["customer_id"])
        chunk["card1_str"] = safe_str(chunk["card1"])
        chunk["card4"] = safe_str(chunk["card4"])
        chunk["card6"] = safe_str(chunk["card6"])
        chunk["product_cd"] = safe_str(chunk["ProductCD"])
        chunk["channel"] = safe_str(chunk["channel"])
        chunk["addr1"] = safe_str(chunk["addr1"])
        chunk["addr2"] = safe_str(chunk["addr2"])
        chunk["ts"] = safe_str(chunk["ts"])
        chunk["amount"] = chunk["TransactionAmt"].fillna(0.0).astype(float)
        chunk["risk_score"] = chunk["risk_score"].fillna(0.0).astype(float)
        chunk["email"] = safe_str(chunk["P_emaildomain"])

        # Map to card_id
        chunk["card_id"] = [
            card_map.get((cid, c1), f"{cid}-K1")
            for cid, c1 in zip(chunk["customer_id"], chunk["card1"])
        ]

        # 1. Customers
        cust_df = chunk[["customer_id"]].drop_duplicates()
        conn.upsertVertexDataFrame(cust_df, "Customer", v_id="customer_id", attributes={})

        # 2. Cards
        card_df = chunk[["card_id", "card4", "card6"]].drop_duplicates(subset=["card_id"])
        conn.upsertVertexDataFrame(card_df, "Card", v_id="card_id", attributes={"card4": "card4", "card6": "card6"})

        # 3. Transactions
        txn_df = chunk[["txn_id", "ts", "amount", "product_cd", "channel", "risk_score", "addr1", "addr2", "card1_str"]].rename(columns={"card1_str": "card1"})
        conn.upsertVertexDataFrame(txn_df, "Transaction", v_id="txn_id", attributes={
            "ts": "ts", "amount": "amount", "product_cd": "product_cd",
            "channel": "channel", "risk_score": "risk_score",
            "addr1": "addr1", "addr2": "addr2", "card1": "card1"
        })

        # 4. OWNS edge (Customer -> Card)
        owns_df = chunk[["customer_id", "card_id"]].drop_duplicates()
        conn.upsertEdgeDataFrame(owns_df, "Customer", "OWNS", "Card", from_id="customer_id", to_id="card_id", attributes={})

        # 5. MADE edge (Card -> Transaction)
        made_df = chunk[["card_id", "txn_id"]]
        conn.upsertEdgeDataFrame(made_df, "Card", "MADE", "Transaction", from_id="card_id", to_id="txn_id", attributes={})

        # 6. PURCHASER_EMAIL (Transaction -> EmailDomain)
        has_email = chunk[chunk["email"] != ""]
        if not has_email.empty:
            email_v_df = has_email[["email"]].drop_duplicates().rename(columns={"email": "domain"})
            conn.upsertVertexDataFrame(email_v_df, "EmailDomain", v_id="domain", attributes={})
            conn.upsertEdgeDataFrame(has_email[["txn_id", "email"]], "Transaction", "PURCHASER_EMAIL", "EmailDomain", from_id="txn_id", to_id="email", attributes={})

        # 7. BILLED_IN (Transaction -> BillingRegion)
        has_region = chunk[chunk["addr1"] != ""]
        if not has_region.empty:
            reg_v_df = has_region[["addr1"]].drop_duplicates().rename(columns={"addr1": "region_code"})
            conn.upsertVertexDataFrame(reg_v_df, "BillingRegion", v_id="region_code", attributes={})
            conn.upsertEdgeDataFrame(has_region[["txn_id", "addr1"]], "Transaction", "BILLED_IN", "BillingRegion", from_id="txn_id", to_id="addr1", attributes={})

        # 8. FROM_DEVICE (Transaction -> DeviceProfile)
        dev_records = []
        for tid in chunk["txn_id"]:
            if tid in id_dict:
                id_info = id_dict[tid]
                did = id_info.get("device_id")
                if did:
                    dev_records.append({
                        "txn_id": tid,
                        "device_id": did,
                        "device_info": id_info["DeviceInfo"],
                        "os": id_info["id_30"],
                        "browser": id_info["id_31"],
                        "screen_res": id_info["id_33"],
                        "device_type": id_info["DeviceType"],
                        "id_15": id_info["id_15"],
                    })
        if dev_records:
            dev_df = pd.DataFrame(dev_records)
            dev_v = dev_df[["device_id", "device_info", "os", "browser", "screen_res", "device_type"]].drop_duplicates(subset=["device_id"])
            conn.upsertVertexDataFrame(dev_v, "DeviceProfile", v_id="device_id", attributes={
                "device_info": "device_info", "os": "os", "browser": "browser",
                "screen_res": "screen_res", "device_type": "device_type"
            })
            conn.upsertEdgeDataFrame(dev_df[["txn_id", "device_id", "id_15"]], "Transaction", "FROM_DEVICE", "DeviceProfile", from_id="txn_id", to_id="device_id", attributes={"id_15": "id_15"})

        # 9. NEXT edge (Transaction -> Transaction)
        sorted_chunk = chunk.sort_values(["customer_id", "card1", "TransactionDT"])
        next_edges = []
        for _, row in sorted_chunk.iterrows():
            cid = row["customer_id"]
            card_id = row["card_id"]
            tid = row["txn_id"]
            dt = float(row["TransactionDT"]) if pd.notna(row["TransactionDT"]) else 0.0
            key = (cid, card_id)
            if key in prev_by_card:
                prev_tid, prev_dt = prev_by_card[key]
                next_edges.append({
                    "from_txn_id": prev_tid,
                    "to_txn_id": tid,
                    "delta_seconds": dt - prev_dt,
                })
            prev_by_card[key] = (tid, dt)

        if next_edges:
            next_df = pd.DataFrame(next_edges)
            conn.upsertEdgeDataFrame(next_df, "Transaction", "NEXT", "Transaction", from_id="from_txn_id", to_id="to_txn_id", attributes={"delta_seconds": "delta_seconds"})

        total_txns += chunk_len
        print(f"    Total transactions ingested so far: {total_txns:,}")

    return total_txns


def ingest_closed_cases(conn):
    print("\nIngesting closed_cases_history.csv...")
    cases = pd.read_csv(DATA_DIR / "closed_cases_history.csv", low_memory=False)

    cases["case_id"] = safe_str(cases["case_id"])
    cases["outcome"] = safe_str(cases["outcome"])
    cases["pattern"] = safe_str(cases["pattern"])
    cases["exposure_usd"] = cases["exposure_usd"].fillna(0.0).astype(float)
    cases["opened_at"] = safe_str(cases["opened_at"])
    cases["closed_at"] = safe_str(cases["closed_at"])
    cases["actions_taken"] = safe_str(cases["actions_taken"])
    cases["report_filed"] = safe_str(cases["report_filed"])
    cases["analyst_notes"] = safe_str(cases["analyst_notes"])
    cases["n_txns"] = cases["n_txns"].fillna(0).astype(int)

    conn.upsertVertexDataFrame(cases, "ClosedCase", v_id="case_id", attributes={
        "outcome": "outcome", "pattern": "pattern", "exposure_usd": "exposure_usd",
        "opened_at": "opened_at", "closed_at": "closed_at", "actions_taken": "actions_taken",
        "report_filed": "report_filed", "analyst_notes": "analyst_notes", "n_txns": "n_txns"
    })

    # ON_CARD edge
    on_card = []
    involves = []
    connected_edges = []

    for _, row in cases.iterrows():
        cid = row["case_id"]
        card_id = safe_str(pd.Series([row.get("card_id")])).iloc[0]
        if card_id:
            on_card.append({"case_id": cid, "card_id": card_id})

        txn_ids = str(row.get("txn_ids", ""))
        if txn_ids and txn_ids != "nan":
            for tid in txn_ids.split("|"):
                tid = tid.strip()
                if tid:
                    try:
                        tid_str = str(int(float(tid)))
                    except Exception:
                        tid_str = tid
                    involves.append({"case_id": cid, "txn_id": tid_str})

        connected = str(row.get("connected_card_ids", ""))
        if connected and connected != "nan":
            for cc in connected.split("|"):
                cc = cc.strip()
                if cc:
                    connected_edges.append({"case_id": cid, "card_id": cc})

    if on_card:
        conn.upsertEdgeDataFrame(pd.DataFrame(on_card), "ClosedCase", "ON_CARD", "Card", from_id="case_id", to_id="card_id", attributes={})
    if involves:
        conn.upsertEdgeDataFrame(pd.DataFrame(involves), "ClosedCase", "INVOLVES", "Transaction", from_id="case_id", to_id="txn_id", attributes={})
    if connected_edges:
        conn.upsertEdgeDataFrame(pd.DataFrame(connected_edges), "ClosedCase", "CONNECTED_TO", "Card", from_id="case_id", to_id="card_id", attributes={})

    print(f"  Ingested {len(cases):,} closed cases, {len(on_card):,} ON_CARD, {len(involves):,} INVOLVES, {len(connected_edges):,} CONNECTED_TO edges")
    return len(cases)


def run_ingestion():
    print("=" * 60)
    print("STARTING DATA INGESTION PIPELINE")
    print("=" * 60)
    conn = connect()
    print(f"Connected to {TG_HOST} [{TG_GRAPH_NAME}]")

    card_map = build_card_id_map()
    txn_count = ingest_transactions(conn, card_map)
    case_count = ingest_closed_cases(conn)

    summary = {
        "transactions_ingested": txn_count,
        "closed_cases_ingested": case_count,
        "card_mappings": len(card_map),
    }
    update_task("ingestion", "completed", summary)
    print("=" * 60)
    print(f"[SUCCESS] Ingestion complete: {txn_count:,} transactions, {case_count:,} closed cases.")
    print("=" * 60)


if __name__ == "__main__":
    run_ingestion()
