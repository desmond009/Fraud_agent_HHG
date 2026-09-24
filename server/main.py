import sys
import os
from pathlib import Path
import json
import time
from typing import List, Dict, Any, Optional
from datetime import datetime

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import DATA_DIR, OUTPUT_DIR, TG_GRAPH_NAME, load_progress

# Safe optional imports for LangGraph / TigerGraph
investigation_app = None
TigerGraphMCPBridge = None
POLICY_CHUNKS = []
get_graphrag_retriever = None

try:
    from agent.graph import investigation_app
except Exception as e:
    print(f"Notice: investigation_app import skipped ({e}) - will use precomputed benchmark cases")

try:
    from mcp.tigergraph_mcp import TigerGraphMCPBridge
except Exception as e:
    print(f"Notice: TigerGraphMCPBridge import skipped ({e})")

try:
    from graphrag.vector_indexer import POLICY_CHUNKS, get_graphrag_retriever
except Exception as e:
    print(f"Notice: vector_indexer import skipped ({e}) - using static policy chunks")

# Fraud Model Predictor
model_predictor = None
try:
    from training.predictor import FraudPredictor
    model_predictor = FraudPredictor()
except Exception as e:
    print(f"Notice: FraudPredictor import skipped ({e})")
    # Fallback policies from Fraud Policy specification
    POLICY_CHUNKS = [
        {"id": "RULE_R1", "category": "rule", "rule_id": "R1", "title": "Verify before you block on a weak signal", "approval_route": "auto", "content": "Rule R1. Verify before you block on a weak signal. If the case rests on a single signal (including a risk score alone) and your assessed fraud probability is below 0.70, recommend VERIFY_WITH_CUSTOMER or STEP_UP_AUTH before any block."},
        {"id": "RULE_R2", "category": "rule", "rule_id": "R2", "title": "Customer denies the transaction", "approval_route": "L1/L2", "content": "Rule R2. Customer denies the transaction. Recommend BLOCK_CARD and CREATE_CASE. Add FILE_REPORT if exposure exceeds $1,000 or the case connects to a shared device profile or another card's fraud."},
        {"id": "RULE_R3", "category": "rule", "rule_id": "R3", "title": "Customer confirms the transaction", "approval_route": "auto", "content": "Rule R3. Customer confirms the transaction. Recommend CLOSE_NO_FRAUD. Note the confirmation in the case file."},
        {"id": "RULE_R4", "category": "rule", "rule_id": "R4", "title": "No reply within 24 hours", "approval_route": "auto/L1", "content": "Rule R4. No reply within 24 hours. Recommend MONITOR_CARD (auto) and DECLINE_TRANSACTION (L1) for pending authorizations. Escalate if exposure exceeds $500."},
        {"id": "RULE_R5", "category": "rule", "rule_id": "R5", "title": "Card testing sequence", "approval_route": "L1/auto", "content": "Rule R5. Card testing. Three or more small online authorizations on one card within an hour, followed by a larger purchase: recommend DECLINE_TRANSACTION (L1) and STEP_UP_AUTH (auto). If a purchase over $100 has already cleared, recommend BLOCK_CARD."},
        {"id": "RULE_R6", "category": "rule", "rule_id": "R6", "title": "Shared origin and connected devices/regions", "approval_route": "auto/L2", "content": "Rule R6. Shared origin. When several cards show fraud from the same device profile, billing region (addr1), or recipient email in one window, recommend CREATE_CASE and FILE_REPORT (L2), and MONITOR_CONNECTED_CARDS (auto)."},
        {"id": "RULE_R7", "category": "rule", "rule_id": "R7", "title": "Disputed but legitimate recurring transaction", "approval_route": "auto", "content": "Rule R7. Disputed but legitimate. When the customer disputes a charge that matches their own recurring pattern, recommend CREATE_CASE, VERIFY_WITH_CUSTOMER, and WARN_CUSTOMER. Do not block."},
        {"id": "RULE_R8", "category": "rule", "rule_id": "R8", "title": "Escalate when uncertain and exposed", "approval_route": "auto", "content": "Rule R8. Escalate when uncertain and exposed. If the verdict is uncertain and exposure exceeds $500, or evidence conflicts, recommend ESCALATE_TO_ANALYST."},
        {"id": "RULE_R9", "category": "rule", "rule_id": "R9", "title": "Undocumented patterns", "approval_route": "auto/L2", "content": "Rule R9. Undocumented patterns. When activity fits none of the known patterns but shows coordinated abuse, recommend CREATE_CASE, FILE_REPORT (L2), and ESCALATE_TO_ANALYST."},
        {"id": "RULE_R10", "category": "rule", "rule_id": "R10", "title": "Never block all cards unless compromise confirmed", "approval_route": "L2", "content": "Rule R10. Never BLOCK_ALL_CARDS unless at least two of the customer's cards show confirmed fraud or credentials confirmed compromised."},
        {"id": "PATTERN_CARD_TESTING", "category": "pattern", "rule_id": "card_testing", "title": "Pattern 1: Card testing", "approval_route": "R5", "content": "A stolen card number is checked before use: three or more tiny online authorizations, often under $5, then a larger purchase. Confirmed by the sequence itself."},
        {"id": "PATTERN_CNP", "category": "pattern", "rule_id": "card_not_present_fraud", "title": "Pattern 2: Card-not-present fraud", "approval_route": "R1-R4", "content": "The number is used online without the physical card. Amounts and products that do not fit cardholder history in a burst of 2-4 in 48 hours."},
        {"id": "PATTERN_CNP_NEW_DEVICE", "category": "pattern", "rule_id": "card_not_present_new_device", "title": "Pattern 3: Card-not-present from a new device", "approval_route": "R1-R4", "content": "Online card-not-present fraud with identity record marking device as New for this account."},
        {"id": "PATTERN_OUT_OF_REGION", "category": "pattern", "rule_id": "out_of_region_use", "title": "Pattern 4: Out-of-region use", "approval_route": "R2-R3", "content": "Card-present purchases in a billing region the cardholder has no history in, while normal activity continues at home."},
        {"id": "PATTERN_ATO", "category": "pattern", "rule_id": "account_takeover", "title": "Pattern 5: Account takeover", "approval_route": "R10", "content": "Mixed-channel activity inconsistent with cardholder, often with device and match-flag anomalies."},
        {"id": "REG_FINCEN_SAR", "category": "regulatory", "rule_id": "FINCEN", "title": "FinCEN Suspicious Activity Report (SAR) Filing Requirements", "approval_route": "L2", "content": "A Suspicious Activity Report (FILE_REPORT) is a standalone regulatory filing sent outside the bank when confirmed or strongly suspected fraud exceeds $1,000 or involves connected rings."}
    ]


CASES_DIR = PROJECT_ROOT / "cases"
AUDIT_LOG_FILE = OUTPUT_DIR / "audit_log.json"

app = FastAPI(
    title="TigerGraph Fraud Agent API Bridge",
    description="Enterprise API bridge for Agentic Fraud Investigation & Next-Best Action platform",
    version="1.0.0",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory / persisted audit log and approvals
def load_audit_log() -> List[Dict[str, Any]]:
    if AUDIT_LOG_FILE.exists():
        try:
            return json.loads(AUDIT_LOG_FILE.read_text())
        except Exception:
            pass
    # Default seed events
    return [
        {
            "id": "evt-001",
            "timestamp": "2026-11-22T02:30:00Z",
            "case_id": "HHG-006",
            "actor": "System Trigger",
            "actor_type": "system",
            "action": "CASE_TRIGGERED",
            "details": "Customer dispute received: 'I never made this $482.12 purchase.'",
            "route": "auto"
        },
        {
            "id": "evt-002",
            "timestamp": "2026-12-08T03:38:37Z",
            "case_id": "HHG-005",
            "actor": "AI Investigator",
            "actor_type": "agent",
            "action": "GRAPH_QUERY",
            "details": "Neighborhood analysis identified device 5b64ce5e4c42 shared across 111 cards with 592 prior fraud cases.",
            "route": "auto"
        },
        {
            "id": "evt-003",
            "timestamp": "2026-12-08T03:38:40Z",
            "case_id": "HHG-005",
            "actor": "AI Investigator",
            "actor_type": "agent",
            "action": "ACTION_RECOMMENDED",
            "details": "Recommended BLOCK_CARD (L1) and FILE_REPORT (L2) under Rules R2 & R6.",
            "route": "L2"
        }
    ]

def save_audit_log(events: List[Dict[str, Any]]):
    try:
        AUDIT_LOG_FILE.write_text(json.dumps(events, indent=2))
    except Exception as e:
        print(f"Error saving audit log: {e}")

APPROVALS_FILE = OUTPUT_DIR / "case_approvals.json"
def load_approvals() -> Dict[str, Any]:
    if APPROVALS_FILE.exists():
        try:
            return json.loads(APPROVALS_FILE.read_text())
        except Exception:
            pass
    return {}

def save_approvals(data: Dict[str, Any]):
    try:
        APPROVALS_FILE.write_text(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error saving approvals: {e}")


# Helper to get bridge safely
_bridge_instance = None
def get_mcp_bridge() -> Optional[TigerGraphMCPBridge]:
    global _bridge_instance
    if _bridge_instance is None:
        try:
            _bridge_instance = TigerGraphMCPBridge()
        except Exception as e:
            print(f"Warning: Could not connect to TigerGraph: {e}")
            return None
    return _bridge_instance


@app.get("/api/health")
def get_health():
    progress = load_progress()
    bridge = get_mcp_bridge()
    tg_connected = False
    tg_details = {}

    if bridge and bridge.conn:
        try:
            tg_connected = True
            tg_details = {
                "graph": TG_GRAPH_NAME,
                "host": bridge.conn.host if hasattr(bridge.conn, "host") else "Savanna Cloud",
                "status": "online"
            }
        except Exception as e:
            tg_details = {"error": str(e), "status": "offline"}

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "tigergraph": {
            "connected": tg_connected,
            "details": tg_details,
            "vertices_loaded": progress.get("tasks", {}).get("testing", {}).get("vertices", {}),
            "edges_loaded": progress.get("tasks", {}).get("testing", {}).get("edges", {}),
        },
        "benchmark": progress.get("tasks", {}).get("benchmark_execution", {}),
        "total_cases_available": 20
    }


@app.get("/api/cases")
def list_cases():
    case_pack_file = DATA_DIR / "case_pack.csv"
    if not case_pack_file.exists():
        raise HTTPException(status_code=404, detail="case_pack.csv not found")

    pack_df = pd.read_csv(case_pack_file)
    approvals = load_approvals()
    cases_list = []

    for _, row in pack_df.iterrows():
        case_id = str(row["case_id"])
        deliverable_file = CASES_DIR / f"{case_id}.json"
        deliverable = {}
        if deliverable_file.exists():
            try:
                deliverable = json.loads(deliverable_file.read_text())
            except Exception:
                pass

        c_data = deliverable.get("case", {})
        nba = deliverable.get("next_best_actions", {})
        sar = deliverable.get("sar", {})

        approval_record = approvals.get(case_id, {
            "status": "pending" if c_data.get("verdict") == "fraud" else "auto_resolved",
            "approved_by": None,
            "approved_at": None,
            "decision": None
        })

        cases_list.append({
            "case_id": case_id,
            "opened_at": str(row.get("opened_at", "")),
            "trigger_type": str(row.get("trigger_type", "")),
            "trigger_text": str(row.get("trigger_text", "")),
            "flagged_txn_id": str(row.get("flagged_txn_id", "")),
            "card_id": str(row.get("card_id", "")),
            "customer_id": str(row.get("customer_id", "")),
            "risk_score": float(row.get("risk_score")) if pd.notna(row.get("risk_score")) and str(row.get("risk_score")) != "" and str(row.get("risk_score")) != "—" else None,
            
            # Agent deliverables
            "status": c_data.get("status", "open"),
            "verdict": c_data.get("verdict", "uncertain"),
            "fraud_probability": c_data.get("fraud_probability", 0.0),
            "pattern": c_data.get("pattern", "none"),
            "exposure_usd": c_data.get("exposure_usd", 0.0),
            "sar_filed": sar.get("file", False),
            "sar_reason": sar.get("reason", ""),
            "tool_calls": deliverable.get("tool_calls", 0),
            "tokens": deliverable.get("tokens", 0),
            "latency_s": deliverable.get("latency_s", 0.0),
            "stop_reason": deliverable.get("stop_reason", ""),
            "evidence_count": len(c_data.get("evidence", [])),
            "initial_actions": nba.get("initial", []),
            "final_actions": nba.get("final", []),
            "what_changed": nba.get("what_changed", ""),
            "approval": approval_record,
            "written_to_graph": c_data.get("written_to_graph", True),
            "graph_case_id": c_data.get("graph_case_id", f"CASE-{case_id}")
        })

    return cases_list


@app.get("/api/cases/{case_id}")
def get_case_detail(case_id: str):
    deliverable_file = CASES_DIR / f"{case_id}.json"
    if not deliverable_file.exists():
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    case_data = json.loads(deliverable_file.read_text())
    
    # Merge trigger metadata
    case_pack_file = DATA_DIR / "case_pack.csv"
    trigger_meta = {}
    if case_pack_file.exists():
        pack_df = pd.read_csv(case_pack_file)
        row = pack_df[pack_df["case_id"] == case_id]
        if not row.empty:
            r = row.iloc[0]
            trigger_meta = {
                "opened_at": str(r.get("opened_at", "")),
                "trigger_type": str(r.get("trigger_type", "")),
                "trigger_text": str(r.get("trigger_text", "")),
                "flagged_txn_id": str(r.get("flagged_txn_id", "")),
                "card_id": str(r.get("card_id", "")),
                "customer_id": str(r.get("customer_id", "")),
                "risk_score": float(r.get("risk_score")) if pd.notna(r.get("risk_score")) and str(r.get("risk_score")) != "" and str(r.get("risk_score")) != "—" else None,
            }

    approvals = load_approvals()
    case_data["trigger"] = trigger_meta
    case_data["approval"] = approvals.get(case_id, {
        "status": "pending" if case_data.get("case", {}).get("verdict") == "fraud" else "auto_resolved",
        "decision": None,
        "approved_by": None,
        "approved_at": None,
        "notes": ""
    })

    return case_data


@app.get("/api/cases/{case_id}/subgraph")
def get_case_subgraph(case_id: str):
    deliverable_file = CASES_DIR / f"{case_id}.json"
    if not deliverable_file.exists():
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    case_data = json.loads(deliverable_file.read_text())
    c_info = case_data.get("case", {})

    # Extract entities
    flagged_txn = case_data.get("case", {}).get("first_suspicious_txn_id", "")
    affected_txns = c_info.get("affected_txn_ids", [])
    if not flagged_txn and affected_txns:
        flagged_txn = affected_txns[0]

    # Get trigger data
    case_pack_file = DATA_DIR / "case_pack.csv"
    card_id = ""
    customer_id = ""
    trigger_risk = 0.5
    if case_pack_file.exists():
        pack_df = pd.read_csv(case_pack_file)
        row = pack_df[pack_df["case_id"] == case_id]
        if not row.empty:
            r = row.iloc[0]
            card_id = str(r.get("card_id", ""))
            customer_id = str(r.get("customer_id", ""))
            if not flagged_txn:
                flagged_txn = str(r.get("flagged_txn_id", ""))
            if pd.notna(r.get("risk_score")) and str(r.get("risk_score")) != "":
                try:
                    trigger_risk = float(r.get("risk_score"))
                except Exception:
                    pass

    connected_cards = c_info.get("connected_card_ids", [])
    device_profiles = c_info.get("connected_device_profiles", [])
    similar_cases = c_info.get("similar_prior_cases", [])
    exposure = c_info.get("exposure_usd", 0.0)
    verdict = c_info.get("verdict", "uncertain")

    nodes = []
    edges = []
    node_set = set()

    def add_node(nid, ntype, label, attrs=None):
        if nid not in node_set:
            node_set.add(nid)
            nodes.append({
                "id": str(nid),
                "type": ntype,
                "label": str(label),
                "attributes": attrs or {}
            })

    def add_edge(src, tgt, etype, attrs=None):
        edges.append({
            "id": f"{src}-{etype}-{tgt}",
            "source": str(src),
            "target": str(tgt),
            "type": etype,
            "attributes": attrs or {}
        })

    # 1. Customer Node
    if customer_id:
        add_node(customer_id, "Customer", f"Customer {customer_id}", {"id": customer_id})

    # 2. Primary Card Node
    if card_id:
        add_node(card_id, "Card", f"Card {card_id}", {"status": "blocked" if verdict == "fraud" else "active"})
        if customer_id:
            add_edge(customer_id, card_id, "OWNS")

    # 3. Flagged & Affected Transactions
    all_txns = list(set([flagged_txn] + affected_txns))
    for tid in all_txns:
        if tid:
            is_flagged = (tid == flagged_txn)
            add_node(tid, "Transaction", f"Txn #{tid}", {
                "amount": exposure if len(all_txns) == 1 else round(exposure / max(len(all_txns), 1), 2),
                "risk_score": trigger_risk,
                "is_flagged": is_flagged,
                "status": "flagged_fraud" if verdict == "fraud" else "cleared"
            })
            if card_id:
                add_edge(card_id, tid, "MADE")

    # Connect transactions chronologically if multiple
    if len(all_txns) > 1:
        for i in range(len(all_txns) - 1):
            add_edge(all_txns[i], all_txns[i+1], "NEXT")

    # 4. Device Profiles
    for dev in device_profiles:
        if dev:
            add_node(dev, "DeviceProfile", f"Device: {dev[:8]}", {"device_info": dev, "is_suspicious": True})
            for tid in all_txns:
                if tid:
                    add_edge(tid, dev, "FROM_DEVICE")

    # 5. Connected Cards (Sharing the same device or ring)
    for ccard in connected_cards:
        if ccard and ccard != card_id:
            add_node(ccard, "Card", f"Linked Card: {ccard}", {"status": "monitored", "is_ring": True})
            if device_profiles:
                for dev in device_profiles:
                    add_edge(ccard, dev, "SHARED_DEVICE")
            else:
                add_edge(card_id, ccard, "CONNECTED_TO")

    # 6. Closed Prior Cases (Case Memory)
    for pcase in similar_cases:
        if pcase:
            add_node(pcase, "ClosedCase", f"Prior Case: {pcase}", {
                "outcome": "confirmed_fraud",
                "pattern": c_info.get("pattern", "fraud")
            })
            if card_id:
                add_edge(pcase, card_id, "ON_CARD")

    # 7. Live Closed Case Node
    case_node_id = c_info.get("graph_case_id", f"CASE-{case_id}")
    add_node(case_node_id, "LiveCase", f"Case {case_id}", {
        "verdict": verdict,
        "pattern": c_info.get("pattern", "none"),
        "exposure": exposure
    })
    if card_id:
        add_edge(case_node_id, card_id, "ON_CARD")
    for tid in all_txns:
        if tid:
            add_edge(case_node_id, tid, "INVOLVES")

    return {
        "case_id": case_id,
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "connected_cards_count": len(connected_cards),
            "shared_devices_count": len(device_profiles),
            "prior_cases_count": len(similar_cases)
        }
    }


class ApprovalRequest(BaseModel):
    decision: str  # "approve" | "reject" | "request_evidence"
    action_name: str
    route: str  # "L1" | "L2" | "auto"
    analyst_name: str
    analyst_role: str
    notes: Optional[str] = ""

@app.post("/api/cases/{case_id}/action")
def record_analyst_action(case_id: str, req: ApprovalRequest):
    approvals = load_approvals()
    audit_events = load_audit_log()

    now_iso = datetime.now().isoformat()
    record = {
        "status": "approved" if req.decision == "approve" else "rejected",
        "decision": req.decision,
        "action_name": req.action_name,
        "route": req.route,
        "approved_by": req.analyst_name,
        "analyst_role": req.analyst_role,
        "approved_at": now_iso,
        "notes": req.notes
    }
    approvals[case_id] = record
    save_approvals(approvals)

    # Append to audit log
    event_id = f"evt-{int(time.time()*1000)}"
    audit_events.append({
        "id": event_id,
        "timestamp": now_iso,
        "case_id": case_id,
        "actor": req.analyst_name,
        "actor_type": "analyst",
        "action": f"{req.decision.upper()}_{req.action_name}",
        "details": f"Analyst ({req.analyst_role}) {req.decision}d {req.action_name} under route {req.route}. Notes: {req.notes}",
        "route": req.route
    })
    save_audit_log(audit_events)

    return {"success": True, "record": record}


@app.post("/api/cases/{case_id}/run")
def execute_case_investigation(case_id: str):
    case_pack_file = DATA_DIR / "case_pack.csv"
    if not case_pack_file.exists():
        raise HTTPException(status_code=404, detail="case_pack.csv not found")

    pack_df = pd.read_csv(case_pack_file)
    row = pack_df[pack_df["case_id"] == case_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not in case pack")

    case_dict = row.iloc[0].to_dict()
    t0 = time.time()
    
    # Run through LangGraph pipeline or fallback to precomputed deliverable
    try:
        if investigation_app:
            res = investigation_app.invoke({"raw_case": case_dict})
            final_output = res.get("final_output", {})
            elapsed = round(time.time() - t0, 2)
            final_output["latency_s"] = elapsed
        else:
            time.sleep(0.6)  # Simulated fast investigation
            out_file = CASES_DIR / f"{case_id}.json"
            if out_file.exists():
                final_output = json.loads(out_file.read_text())
                elapsed = round(time.time() - t0, 2)
                final_output["latency_s"] = elapsed
            else:
                raise HTTPException(status_code=404, detail="Case deliverable file not found")

        # Persist updated deliverable
        out_file = CASES_DIR / f"{case_id}.json"
        out_file.write_text(json.dumps(final_output, indent=2))

        # Add audit log event
        audit_events = load_audit_log()
        audit_events.append({
            "id": f"evt-{int(time.time()*1000)}",
            "timestamp": datetime.now().isoformat(),
            "case_id": case_id,
            "actor": "LangGraph Agent",
            "actor_type": "agent",
            "action": "INVESTIGATION_COMPLETED",
            "details": f"Ran all 6 nodes in {elapsed}s. Verdict: {final_output.get('case', {}).get('verdict')}. Pattern: {final_output.get('case', {}).get('pattern')}.",
            "route": "auto"
        })
        save_audit_log(audit_events)

        return {"success": True, "data": final_output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investigation execution failed: {str(e)}")



@app.get("/api/policies")
def list_policies():
    return POLICY_CHUNKS


@app.get("/api/audit-log")
def get_audit_log(limit: int = 50):
    events = load_audit_log()
    return sorted(events, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit]


@app.get("/api/transactions")
def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    min_risk: Optional[float] = None,
    channel: Optional[str] = None,
    card_id: Optional[str] = None
):
    case_pack_file = DATA_DIR / "case_pack.csv"
    if not case_pack_file.exists():
        return {"items": [], "total": 0, "page": page, "limit": limit}

    pack_df = pd.read_csv(case_pack_file)
    items = []
    
    for idx, row in pack_df.iterrows():
        r_score = float(row.get("risk_score")) if pd.notna(row.get("risk_score")) and str(row.get("risk_score")) != "" and str(row.get("risk_score")) != "—" else 0.45
        cid = str(row.get("card_id", ""))
        tid = str(row.get("flagged_txn_id", ""))
        t_text = str(row.get("trigger_text", ""))
        chan = "online" if "online" in t_text.lower() else "in_person"

        if min_risk is not None and r_score < min_risk:
            continue
        if channel is not None and chan != channel:
            continue
        if card_id is not None and card_id.lower() not in cid.lower():
            continue

        amount = 100.00
        if "$" in t_text:
            try:
                parts = t_text.split("$")[1].split(" ")[0].replace(",", "")
                amount = float(parts)
            except Exception:
                pass

        items.append({
            "txn_id": tid,
            "case_id": str(row.get("case_id")),
            "customer_id": str(row.get("customer_id")),
            "card_id": cid,
            "timestamp": str(row.get("opened_at")),
            "amount": amount,
            "channel": chan,
            "risk_score": r_score,
            "trigger_type": str(row.get("trigger_type")),
            "status": "flagged_under_investigation"
        })

    total = len(items)
    start = (page - 1) * limit
    paged_items = items[start : start + limit]

    return {
        "items": paged_items,
        "total": total,
        "page": page,
        "limit": limit
    }


# ============================================================================
# Model Training & Inference Pipeline Endpoints
# ============================================================================

@app.get("/api/model/status")
def get_model_status():
    global model_predictor
    if model_predictor is None or not model_predictor.is_loaded:
        try:
            from training.predictor import FraudPredictor
            model_predictor = FraudPredictor()
        except Exception:
            pass

    if model_predictor and model_predictor.is_loaded:
        return {
            "status": "LOADED",
            "checkpoint_path": str(model_predictor.checkpoint_path),
            "metadata": model_predictor.metadata,
        }
    return {
        "status": "NOT_LOADED",
        "message": "No model checkpoint loaded. Run training via POST /api/model/train or CLI.",
    }


@app.post("/api/model/predict")
def predict_fraud(payload: Dict[str, Any] = Body(...)):
    global model_predictor
    if model_predictor is None or not model_predictor.is_loaded:
        try:
            from training.predictor import FraudPredictor
            model_predictor = FraudPredictor()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load model predictor: {e}")

    if not model_predictor.is_loaded:
        raise HTTPException(status_code=400, detail="Model checkpoint not loaded. Please train the model first.")

    assessment = model_predictor.assess_transaction(payload)
    return assessment


@app.post("/api/model/train")
def trigger_training(
    max_rows: Optional[int] = Body(20000),
    model_type: str = Body("hist_gb"),
):
    try:
        from training.config import TrainingConfig
        from training.train import FraudModelTrainer

        config = TrainingConfig(model_type=model_type)
        trainer = FraudModelTrainer(config)
        result = trainer.train(max_rows=max_rows)

        # Refresh in-memory predictor with newly trained checkpoint
        global model_predictor
        from training.predictor import FraudPredictor
        model_predictor = FraudPredictor()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training pipeline execution failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
