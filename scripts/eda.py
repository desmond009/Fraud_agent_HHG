import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))

import pandas as pd
import json
from config import DATA_DIR, OUTPUT_DIR, update_task

LINKING_FIELDS_TXN = [
    "TransactionID", "customer_id", "card1", "card2", "card3", "card4", "card5", "card6",
    "addr1", "addr2", "P_emaildomain", "R_emaildomain", "ProductCD", "TransactionAmt",
    "ts", "channel", "risk_score",
]
LINKING_FIELDS_ID = [
    "TransactionID", "DeviceType", "DeviceInfo",
    "id_15", "id_23", "id_30", "id_31", "id_33", "id_34", "id_35", "id_36", "id_37", "id_38",
]


def summarize_df(df, name, fields=None):
    cols = [c for c in (fields or df.columns) if c in df.columns]
    info = {
        "name": name,
        "shape": list(df.shape),
        "columns_total": len(df.columns),
        "key_fields": {},
    }
    for c in cols:
        info["key_fields"][c] = {
            "dtype": str(df[c].dtype),
            "nulls": int(df[c].isna().sum()),
            "null_pct": round(df[c].isna().mean() * 100, 2),
            "nunique": int(df[c].nunique()),
            "sample": [str(v) for v in df[c].dropna().head(3).tolist()],
        }
    return info


def run_eda():
    print("=" * 60)
    print("EDA: Loading transactions (chunked)...")
    txn_chunks = pd.read_csv(DATA_DIR / "transactions.csv", chunksize=100_000, low_memory=False)
    txn = pd.concat(txn_chunks, ignore_index=True)
    print(f"  transactions: {txn.shape[0]:,} rows × {txn.shape[1]} cols")

    print("EDA: Loading identity...")
    identity = pd.read_csv(DATA_DIR / "identity.csv", low_memory=False)
    print(f"  identity: {identity.shape[0]:,} rows × {identity.shape[1]} cols")

    print("EDA: Loading closed_cases_history...")
    cases = pd.read_csv(DATA_DIR / "closed_cases_history.csv", low_memory=False)
    print(f"  closed_cases: {cases.shape[0]:,} rows × {cases.shape[1]} cols")

    print("EDA: Loading case_pack...")
    pack = pd.read_csv(DATA_DIR / "case_pack.csv", low_memory=False)
    print(f"  case_pack: {pack.shape[0]:,} rows × {pack.shape[1]} cols")

    txn_summary = summarize_df(txn, "transactions", LINKING_FIELDS_TXN)
    id_summary = summarize_df(identity, "identity", LINKING_FIELDS_ID)
    cases_summary = summarize_df(cases, "closed_cases_history")
    pack_summary = summarize_df(pack, "case_pack")

    card_ids_from_cases = set(cases["card_id"].dropna().unique())
    card_ids_from_pack = set(pack["card_id"].dropna().unique())
    all_known_card_ids = card_ids_from_cases | card_ids_from_pack

    unique_cards_per_customer = txn.groupby("customer_id")["card1"].nunique()

    vertex_estimates = {
        "Customer": int(txn["customer_id"].nunique()),
        "Card": int(txn.groupby(["customer_id", "card1"]).ngroups),
        "Transaction": int(txn["TransactionID"].nunique()),
        "DeviceProfile": int(identity["DeviceInfo"].dropna().nunique()),
        "EmailDomain": int(txn["P_emaildomain"].dropna().nunique()),
        "BillingRegion": int(txn["addr1"].dropna().nunique()),
        "ClosedCase": int(cases["case_id"].nunique()),
    }

    card_id_analysis = {
        "known_card_ids_in_cases": len(card_ids_from_cases),
        "known_card_ids_in_pack": len(card_ids_from_pack),
        "max_cards_per_customer": int(unique_cards_per_customer.max()),
        "customers_with_multiple_cards": int((unique_cards_per_customer > 1).sum()),
        "card_id_format_sample": sorted(list(card_ids_from_pack))[:5],
    }

    result = {
        "transactions": txn_summary,
        "identity": id_summary,
        "closed_cases_history": cases_summary,
        "case_pack": pack_summary,
        "vertex_estimates": vertex_estimates,
        "card_id_analysis": card_id_analysis,
    }

    out_path = OUTPUT_DIR / "eda_summary.json"
    out_path.write_text(json.dumps(result, indent=2))
    print(f"\nEDA summary written to {out_path}")

    print("\n--- Vertex Estimates ---")
    for v, c in vertex_estimates.items():
        print(f"  {v}: {c:,}")

    print("\n--- Card ID Analysis ---")
    for k, v in card_id_analysis.items():
        print(f"  {k}: {v}")

    update_task("eda", "completed", {"output": str(out_path)})
    print("\n[OK] EDA complete.")


if __name__ == "__main__":
    run_eda()
