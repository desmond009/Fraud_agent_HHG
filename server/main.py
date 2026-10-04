import logging
import re
import sys
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import OUTPUT_DIR, TG_GRAPH_NAME, load_progress
from server import auth, data_store
from server.audit_store import AuditStore, utc_now_iso
from server.auth import Analyst, current_analyst, normalize_role, require_role
from server.schemas import (
    ActionResponse, ApprovalRequest, AuditEvent, CaseSummary, PolicyChunk,
    RunRequest, RunResponse, TrainRequest, TransactionPage,
)
from server.static_policies import STATIC_POLICY_CHUNKS

logger = logging.getLogger("fraudagent.api")

# --- Optional heavy components: each failure is logged and degrades one feature only ---------
investigation_app = None
try:
    from agent.graph import investigation_app
except Exception as e:
    logger.warning("Agent runtime unavailable (%s). /run will replay stored deliverables.", e)

TigerGraphMCPBridge = None
GraphQueryError = RuntimeError
try:
    from graph_tools.tigergraph_mcp import GraphQueryError, TigerGraphMCPBridge
except Exception as e:
    logger.warning("TigerGraph bridge unavailable (%s)", e)

POLICY_CHUNKS: List[Dict[str, Any]] = STATIC_POLICY_CHUNKS
try:
    from graphrag.vector_indexer import POLICY_CHUNKS
except Exception as e:
    logger.warning("GraphRAG policy module unavailable (%s). Using static policy copy.", e)

model_predictor = None
try:
    from training.predictor import FraudPredictor
    model_predictor = FraudPredictor()
except Exception as e:
    logger.warning("FraudPredictor unavailable (%s)", e)

store = AuditStore(
    OUTPUT_DIR / "audit.db",
    legacy_audit_json=OUTPUT_DIR / "audit_log.json",
    legacy_approvals_json=OUTPUT_DIR / "case_approvals.json",
)

app = FastAPI(
    title="TigerGraph Fraud Agent API Bridge",
    description="API bridge for agentic fraud investigation and next-best-action decisions",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=auth.cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# Every route except /api/health requires authentication when ANALYST_TOKENS is configured.
protected = [Depends(current_analyst)]

# --- TigerGraph connection (throttled reconnect, real liveness probe) -------------------------
_bridge_instance = None
_bridge_failed_at = 0.0
_bridge_lock = threading.Lock()
BRIDGE_RETRY_SECONDS = 30
_health_cache: Dict[str, Any] = {"at": 0.0, "ok": False, "error": None}


def get_mcp_bridge():
    global _bridge_instance, _bridge_failed_at
    if TigerGraphMCPBridge is None:
        return None
    with _bridge_lock:
        if _bridge_instance is None:
            if time.time() - _bridge_failed_at < BRIDGE_RETRY_SECONDS:
                return None
            try:
                _bridge_instance = TigerGraphMCPBridge()
            except Exception as e:
                _bridge_failed_at = time.time()
                logger.warning("Could not connect to TigerGraph: %s", e)
                return None
        return _bridge_instance


def tigergraph_status() -> Dict[str, Any]:
    if time.time() - _health_cache["at"] < 15:
        return _health_cache
    bridge = get_mcp_bridge()
    ok, error = False, None
    if bridge is None:
        error = "not configured or unreachable"
    else:
        try:
            bridge.conn.echo()
            ok = True
        except Exception as e:
            error = str(e)[:200]
    _health_cache.update(at=time.time(), ok=ok, error=error)
    return _health_cache


# --- Helpers -------------------------------------------------------------------------------
def default_approval(verdict: Optional[str]) -> Dict[str, Any]:
    return {
        "status": "pending" if verdict == "fraud" else "auto_resolved",
        "decision": None,
        "approved_by": None,
        "approved_at": None,
        "notes": "",
    }


def trigger_meta(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "opened_at": row.get("opened_at") or "",
        "trigger_type": row.get("trigger_type") or "",
        "trigger_text": row.get("trigger_text") or "",
        "flagged_txn_id": row.get("flagged_txn_id") or "",
        "card_id": row.get("card_id") or "",
        "customer_id": row.get("customer_id") or "",
        "risk_score": data_store.to_float(row.get("risk_score")),
    }


# --- Routes --------------------------------------------------------------------------------
@app.get("/api/health")
def get_health():
    progress = load_progress()
    tg = tigergraph_status()
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "auth": "enabled" if auth.AUTH_ENABLED else "dev-mode (no authentication)",
        "agent_runtime": "available" if investigation_app else "unavailable (replay mode)",
        "tigergraph": {
            "connected": tg["ok"],
            "details": {"graph": TG_GRAPH_NAME, "status": "online" if tg["ok"] else "offline", "error": tg["error"]},
            "vertices_loaded": progress.get("tasks", {}).get("testing", {}).get("vertices", {}),
            "edges_loaded": progress.get("tasks", {}).get("testing", {}).get("edges", {}),
        },
        "benchmark": progress.get("tasks", {}).get("benchmark_execution", {}),
        "total_cases_available": len(data_store.get_case_pack()) if data_store.CASE_PACK_FILE.exists() else 0,
        "audit_chain": store.verify_chain(),
    }


@app.get("/api/cases", response_model=List[CaseSummary], dependencies=protected)
def list_cases():
    approvals = store.get_approvals()
    cases_list = []
    for row in data_store.get_case_pack():
        case_id = row["case_id"]
        deliverable = data_store.load_case(case_id, missing_ok=True)
        c_data = deliverable.get("case", {})
        nba = deliverable.get("next_best_actions", {})
        sar = deliverable.get("sar", {})
        meta = trigger_meta(row)

        cases_list.append({
            "case_id": case_id,
            **meta,
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
            "approval": approvals.get(case_id) or default_approval(c_data.get("verdict")),
            "written_to_graph": c_data.get("written_to_graph", True),
            "graph_case_id": c_data.get("graph_case_id", f"CASE-{case_id}"),
        })
    return cases_list


@app.get("/api/cases/{case_id}", dependencies=protected)
def get_case_detail(case_id: str):
    case_data = dict(data_store.load_case(case_id))
    row = data_store.get_pack_row(case_id)
    case_data["trigger"] = trigger_meta(row) if row else {}
    case_data["approval"] = store.get_approval(case_id) or default_approval(case_data.get("case", {}).get("verdict"))
    return case_data


@app.get("/api/cases/{case_id}/subgraph", dependencies=protected)
def get_case_subgraph(case_id: str):
    case_data = data_store.load_case(case_id)
    c_info = case_data.get("case", {})

    flagged_txn = c_info.get("first_suspicious_txn_id", "")
    affected_txns = c_info.get("affected_txn_ids", [])
    if not flagged_txn and affected_txns:
        flagged_txn = affected_txns[0]

    card_id = customer_id = ""
    trigger_risk = 0.5
    row = data_store.get_pack_row(case_id)
    if row:
        card_id = row.get("card_id") or ""
        customer_id = row.get("customer_id") or ""
        if not flagged_txn:
            flagged_txn = row.get("flagged_txn_id") or ""
        risk = data_store.to_float(row.get("risk_score"))
        if risk is not None:
            trigger_risk = risk

    connected_cards = c_info.get("connected_card_ids", [])
    device_profiles = c_info.get("connected_device_profiles", [])
    similar_cases = c_info.get("similar_prior_cases", [])
    exposure = c_info.get("exposure_usd", 0.0)
    verdict = c_info.get("verdict", "uncertain")

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    node_set = set()

    def add_node(nid, ntype, label, attrs=None):
        if nid not in node_set:
            node_set.add(nid)
            nodes.append({"id": str(nid), "type": ntype, "label": str(label), "attributes": attrs or {}})

    def add_edge(src, tgt, etype, attrs=None):
        edges.append({"id": f"{src}-{etype}-{tgt}", "source": str(src), "target": str(tgt),
                      "type": etype, "attributes": attrs or {}})

    if customer_id:
        add_node(customer_id, "Customer", f"Customer {customer_id}", {"id": customer_id})

    if card_id:
        add_node(card_id, "Card", f"Card {card_id}", {"status": "blocked" if verdict == "fraud" else "active"})
        if customer_id:
            add_edge(customer_id, card_id, "OWNS")

    all_txns = [t for t in dict.fromkeys([flagged_txn] + list(affected_txns)) if t]  # ordered, de-duplicated
    for tid in all_txns:
        add_node(tid, "Transaction", f"Txn #{tid}", {
            "amount": round(exposure / max(len(all_txns), 1), 2),
            "risk_score": trigger_risk,
            "is_flagged": tid == flagged_txn,
            "status": "flagged_fraud" if verdict == "fraud" else "cleared",
        })
        if card_id:
            add_edge(card_id, tid, "MADE")

    for i in range(len(all_txns) - 1):
        add_edge(all_txns[i], all_txns[i + 1], "NEXT")

    for dev in device_profiles:
        if dev:
            add_node(dev, "DeviceProfile", f"Device: {dev[:8]}", {"device_info": dev, "is_suspicious": True})
            for tid in all_txns:
                add_edge(tid, dev, "FROM_DEVICE")

    for ccard in connected_cards:
        if ccard and ccard != card_id:
            add_node(ccard, "Card", f"Linked Card: {ccard}", {"status": "monitored", "is_ring": True})
            if device_profiles:
                for dev in device_profiles:
                    add_edge(ccard, dev, "SHARED_DEVICE")
            elif card_id:
                add_edge(card_id, ccard, "CONNECTED_TO")

    for pcase in similar_cases:
        if pcase:
            add_node(pcase, "ClosedCase", f"Prior Case: {pcase}", {
                "outcome": "confirmed_fraud",
                "pattern": c_info.get("pattern", "fraud"),
            })
            if card_id:
                add_edge(pcase, card_id, "ON_CARD")

    case_node_id = c_info.get("graph_case_id", f"CASE-{case_id}")
    add_node(case_node_id, "LiveCase", f"Case {case_id}", {
        "verdict": verdict, "pattern": c_info.get("pattern", "none"), "exposure": exposure,
    })
    if card_id:
        add_edge(case_node_id, card_id, "ON_CARD")
    for tid in all_txns:
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
            "prior_cases_count": len(similar_cases),
        },
    }


@app.post("/api/cases/{case_id}/action", response_model=ActionResponse)
def record_analyst_action(case_id: str, req: ApprovalRequest, analyst: Optional[Analyst] = Depends(current_analyst)):
    data_store.valid_case_id(case_id)
    if data_store.get_pack_row(case_id) is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    # Identity: from the token when auth is on; from the (unverified) body in dev mode.
    name = analyst.name if analyst else (req.analyst_name.strip() or "Unknown analyst")
    role = analyst.role if analyst else normalize_role(req.analyst_role)
    display_role = role if analyst else req.analyst_role

    # Role enforcement: approving an L2 route needs an L2 approver.
    if req.route == "L2" and req.decision == "approve" and role != "L2":
        raise HTTPException(status_code=403, detail="L2 approval required for this action")

    now_iso = utc_now_iso()
    if req.decision == "request_evidence":
        status = "pending"  # case stays open while evidence is gathered
    else:
        status = "approved" if req.decision == "approve" else "rejected"

    record = {
        "status": status,
        "decision": req.decision,
        "action_name": req.action_name,
        "route": req.route,
        "approved_by": name,
        "analyst_role": display_role,
        "approved_at": now_iso,
        "notes": req.notes or "",
        "identity_verified": bool(analyst),
    }
    store.record_decision(case_id, record, {
        "case_id": case_id,
        "actor": name,
        "actor_type": "analyst",
        "action": f"{req.decision.upper()}_{req.action_name}",
        "details": (f"Analyst ({display_role}{'' if analyst else ', unverified'}) chose '{req.decision}' for "
                    f"{req.action_name} under route {req.route}. Notes: {req.notes or ''}"),
        "route": req.route,
    })
    return {"success": True, "record": record}


_run_locks: Dict[str, threading.Lock] = {}
_run_locks_guard = threading.Lock()


def _run_lock(case_id: str) -> threading.Lock:
    with _run_locks_guard:
        return _run_locks.setdefault(case_id, threading.Lock())


@app.post("/api/cases/{case_id}/run", response_model=RunResponse, dependencies=[Depends(require_role("L1"))])
def execute_case_investigation(case_id: str, req: Optional[RunRequest] = None):
    row = data_store.get_pack_row(data_store.valid_case_id(case_id))
    if row is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not in case pack")

    lock = _run_lock(case_id)
    if not lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail=f"Investigation for {case_id} is already running")
    try:
        t0 = time.time()
        if investigation_app is None:
            # No agent runtime: serve the stored deliverable and say so, in the response and in the audit trail.
            stored = data_store.load_case(case_id, missing_ok=True)
            if not stored:
                raise HTTPException(status_code=404, detail="Case deliverable file not found")
            store.append_event({
                "case_id": case_id, "actor": "API Server", "actor_type": "system",
                "action": "INVESTIGATION_REPLAYED",
                "details": "Agent runtime unavailable: served the stored deliverable. No agent nodes were executed.",
                "route": "auto",
            })
            return {"success": True, "mode": "replay", "data": stored}

        state_in: Dict[str, Any] = {"raw_case": row}
        if req and req.customer_response:
            state_in["customer_response"] = req.customer_response
        try:
            res = investigation_app.invoke(state_in)
        except GraphQueryError as e:
            logger.error("Graph query failed for %s: %s", case_id, e)
            raise HTTPException(status_code=502, detail=f"TigerGraph query failed: {e}")
        except Exception as e:
            logger.exception("Investigation failed for %s", case_id)
            raise HTTPException(status_code=500, detail=f"Investigation execution failed: {e}")

        final_output = res.get("final_output", {})
        elapsed = round(time.time() - t0, 2)
        final_output["latency_s"] = elapsed
        data_store.save_case(case_id, final_output)

        nodes_run = res.get("state_history", [])
        simulated = any(r.get("simulated") for r in final_output.get("evidence_requests", []))
        store.append_event({
            "case_id": case_id, "actor": "LangGraph Agent", "actor_type": "agent",
            "action": "INVESTIGATION_COMPLETED",
            "details": (f"Ran {len(nodes_run)} nodes in {elapsed}s. "
                        f"Verdict: {final_output.get('case', {}).get('verdict')}. "
                        f"Pattern: {final_output.get('case', {}).get('pattern')}. "
                        f"Customer reply: {'simulated' if simulated else 'provided by analyst'}."),
            "route": "auto",
        })
        return {"success": True, "mode": "agent", "data": final_output}
    finally:
        lock.release()


@app.get("/api/policies", response_model=List[PolicyChunk], dependencies=protected)
def list_policies():
    return POLICY_CHUNKS


@app.get("/api/audit-log", response_model=List[AuditEvent], dependencies=protected)
def get_audit_log(limit: int = Query(50, ge=1, le=1000), case_id: Optional[str] = None):
    return store.list_events(limit=limit, case_id=case_id)


@app.get("/api/audit-log/verify", dependencies=protected)
def verify_audit_log():
    """Re-computes the hash chain; `valid: false` means history was altered."""
    return store.verify_chain()


_AMOUNT_RE = re.compile(r"\$\s?([0-9][0-9,]*(?:\.[0-9]+)?)")


@app.get("/api/transactions", response_model=TransactionPage, dependencies=protected)
def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    min_risk: Optional[float] = Query(None, ge=0, le=1),
    channel: Optional[str] = None,
    card_id: Optional[str] = None,
):
    if not data_store.CASE_PACK_FILE.exists():
        return {"items": [], "total": 0, "page": page, "limit": limit}

    items = []
    for row in data_store.get_case_pack():
        r_score = data_store.to_float(row.get("risk_score"))
        r_score = 0.45 if r_score is None else r_score
        cid = row.get("card_id") or ""
        t_text = row.get("trigger_text") or ""
        chan = "online" if "online" in t_text.lower() else "in_person"

        if min_risk is not None and r_score < min_risk:
            continue
        if channel is not None and chan != channel:
            continue
        if card_id is not None and card_id.lower() not in cid.lower():
            continue

        m = _AMOUNT_RE.search(t_text)
        amount = float(m.group(1).replace(",", "")) if m else 100.00

        items.append({
            "txn_id": row.get("flagged_txn_id") or "",
            "case_id": row.get("case_id") or "",
            "customer_id": row.get("customer_id") or "",
            "card_id": cid,
            "timestamp": row.get("opened_at") or "",
            "amount": amount,
            "channel": chan,
            "risk_score": r_score,
            "trigger_type": row.get("trigger_type") or "",
            "status": "flagged_under_investigation",
        })

    start = (page - 1) * limit
    return {"items": items[start:start + limit], "total": len(items), "page": page, "limit": limit}


# ============================================================================
# Model inference and (background) training
# ============================================================================
def _ensure_predictor():
    global model_predictor
    if model_predictor is None or not model_predictor.is_loaded:
        try:
            from training.predictor import FraudPredictor
            model_predictor = FraudPredictor()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load model predictor: {e}")
    return model_predictor


@app.get("/api/model/status", dependencies=protected)
def get_model_status():
    try:
        predictor = _ensure_predictor()
    except HTTPException:
        predictor = None
    if predictor and predictor.is_loaded:
        return {"status": "LOADED", "checkpoint_path": str(predictor.checkpoint_path), "metadata": predictor.metadata}
    return {"status": "NOT_LOADED",
            "message": "No model checkpoint loaded. Run training via POST /api/model/train or CLI."}


@app.post("/api/model/predict", dependencies=protected)
def predict_fraud(payload: Dict[str, Any]):
    predictor = _ensure_predictor()
    if not predictor.is_loaded:
        raise HTTPException(status_code=400, detail="Model checkpoint not loaded. Please train the model first.")
    if not payload or len(payload) > 500:
        raise HTTPException(status_code=422, detail="Provide a transaction object with at most 500 fields")
    return predictor.assess_transaction(payload)


_train_jobs: Dict[str, Dict[str, Any]] = {}
_train_lock = threading.Lock()


def _train_worker(job_id: str, req: TrainRequest):
    global model_predictor
    try:
        from training.config import TrainingConfig
        from training.predictor import FraudPredictor
        from training.train import FraudModelTrainer

        result = FraudModelTrainer(TrainingConfig(model_type=req.model_type)).train(max_rows=req.max_rows)
        model_predictor = FraudPredictor()
        _train_jobs[job_id].update(status="completed", result=result)
    except Exception as e:
        logger.exception("Training job %s failed", job_id)
        _train_jobs[job_id].update(status="failed", error=str(e))
    finally:
        _train_jobs[job_id]["finished_at"] = utc_now_iso()


@app.post("/api/model/train", status_code=202, dependencies=[Depends(require_role("L2"))])
def trigger_training(req: TrainRequest):
    """Starts training in the background and returns a job id; poll GET /api/model/train/{job_id}."""
    with _train_lock:
        if any(j["status"] == "running" for j in _train_jobs.values()):
            raise HTTPException(status_code=409, detail="A training job is already running")
        job_id = uuid.uuid4().hex[:12]
        _train_jobs[job_id] = {"job_id": job_id, "status": "running", "started_at": utc_now_iso(),
                               "request": req.model_dump()}
    threading.Thread(target=_train_worker, args=(job_id, req), daemon=True).start()
    return _train_jobs[job_id]


@app.get("/api/model/train/{job_id}", dependencies=protected)
def get_training_job(job_id: str):
    job = _train_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown training job")
    return job


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="127.0.0.1", port=8000, reload=True)
