import time
from typing import Dict, Any, List
from agent.state import InvestigationState
from agent.llm import generate_sar_narrative, generate_case_summary
from mcp.tigergraph_mcp import TigerGraphMCPBridge
from graphrag.vector_indexer import get_graphrag_retriever

_bridge = None
_retriever = None


def get_bridge():
    global _bridge
    if _bridge is None:
        _bridge = TigerGraphMCPBridge()
    return _bridge


def get_retriever():
    global _retriever
    if _retriever is None:
        _retriever = get_graphrag_retriever()
    return _retriever


def trigger_ingestion(state: InvestigationState) -> Dict[str, Any]:
    raw = state.get("raw_case", {})
    case_id = raw.get("case_id", "HHG-001")
    opened_at = str(raw.get("opened_at", "2016-12-05 01:55:28"))
    trigger_type = str(raw.get("trigger_type", "risk_score"))
    trigger_text = str(raw.get("trigger_text", ""))
    flagged_txn_id = str(raw.get("flagged_txn_id", "3514030"))
    card_id = str(raw.get("card_id", "C12382-K1"))
    customer_id = str(raw.get("customer_id", "C12382"))
    risk_score = float(raw.get("risk_score", 0.0)) if raw.get("risk_score") and str(raw.get("risk_score")) != "—" else 0.0

    history = state.get("state_history", [])
    history.append("trigger_ingestion")

    return {
        "case_id": case_id,
        "opened_at": opened_at,
        "trigger_type": trigger_type,
        "trigger_text": trigger_text,
        "flagged_txn_id": flagged_txn_id,
        "card_id": card_id,
        "customer_id": customer_id,
        "risk_score": risk_score,
        "tool_calls": 0,
        "tokens": 0,
        "step_count": 1,
        "state_history": history,
        "start_time": time.time(),
    }


def initial_investigation(state: InvestigationState) -> Dict[str, Any]:
    bridge = get_bridge()
    tool_calls = state.get("tool_calls", 0)

    # 1. Flagged transaction details
    txn_attr = bridge.get_transaction(state["flagged_txn_id"])
    tool_calls += 1

    # 2. Window velocity query
    window_data = bridge.query_txn_window(state["card_id"], state["opened_at"], window_hours=24)
    tool_calls += 1

    # 3. Neighborhood & device/region sharing
    neigh_data = bridge.query_neighborhood(state["flagged_txn_id"])
    tool_calls += 1

    history = state.get("state_history", [])
    history.append("initial_investigation")

    return {
        "txn_attributes": txn_attr,
        "window_data": window_data,
        "neighborhood_data": neigh_data,
        "tool_calls": tool_calls,
        "step_count": state.get("step_count", 0) + 1,
        "state_history": history,
    }


def evidence_synthesis(state: InvestigationState) -> Dict[str, Any]:
    bridge = get_bridge()
    retriever = get_retriever()
    tool_calls = state.get("tool_calls", 0)

    window = state.get("window_data", {})
    neigh = state.get("neighborhood_data", {})
    trigger_type = state.get("trigger_type", "")
    trigger_text = state.get("trigger_text", "")
    risk_score = state.get("risk_score", 0.0)
    card_id = state.get("card_id", "")
    flagged_txn_id = state.get("flagged_txn_id", "")

    evidence = []
    pattern = "none"
    pattern_desc = ""

    # Check Card Testing
    is_card_testing = window.get("is_card_testing", False) or (window.get("micro_authorizations", 0) >= 3 and window.get("large_purchases", 0) >= 1)
    if is_card_testing:
        pattern = "card_testing"
        evidence.append({
            "claim": f"{window.get('micro_authorizations', 0)} micro authorizations under $5 followed by larger purchase in window",
            "source": "graph",
            "ref": f"query:txn_window(card_id={card_id})",
            "entity_ids": window.get("txn_ids", [flagged_txn_id])[:4],
        })

    # Check Device / Region sharing
    conn_cards = neigh.get("connected_cards", [])
    prior_fraud = neigh.get("prior_fraud_cases", 0)
    if len(conn_cards) > 1 and prior_fraud > 0:
        if pattern == "none":
            pattern = "card_not_present_new_device" if "online" in trigger_text.lower() else "out_of_region_use"
        evidence.append({
            "claim": f"Device/region cluster shared across {len(conn_cards)} cards, connected to {prior_fraud} prior confirmed fraud cases",
            "source": "graph",
            "ref": f"query:device_region_neighborhood(txn_id={flagged_txn_id})",
            "entity_ids": [str(c) for c in conn_cards[:3]],
        })

    # Check customer report
    if trigger_type == "customer_report":
        if pattern == "none":
            pattern = "card_not_present_fraud"
        evidence.append({
            "claim": f"Cardholder explicitly disputed the transaction: '{trigger_text}'",
            "source": "customer",
            "ref": "trigger:customer_report",
            "entity_ids": [flagged_txn_id],
        })
    elif trigger_type == "risk_score" and pattern == "none":
        evidence.append({
            "claim": f"Real-time fraud model scored transaction at {risk_score:.2f} (weak single signal)",
            "source": "model",
            "ref": "trigger:risk_score",
            "entity_ids": [flagged_txn_id],
        })

    # GraphRAG Policy Retrieval
    search_query = f"{pattern} {trigger_text}"
    retrieved_rules = retriever.retrieve_guidance(search_query, top_k=3)
    tool_calls += 1

    # Historical Case Matcher
    similar_cases = bridge.match_historical_cases(pattern_filter=pattern if pattern != "none" else "", max_results=2)
    tool_calls += 1
    prior_case_ids = [c.get("v_id") for c in similar_cases if c.get("v_id")]

    history = state.get("state_history", [])
    history.append("evidence_synthesis")

    return {
        "evidence": evidence,
        "pattern": pattern,
        "pattern_description": pattern_desc,
        "retrieved_rules": retrieved_rules,
        "similar_prior_cases": prior_case_ids,
        "prior_case_details": similar_cases,
        "tool_calls": tool_calls,
        "step_count": state.get("step_count", 0) + 1,
        "state_history": history,
    }


def uncertainty_assessment(state: InvestigationState) -> Dict[str, Any]:
    trigger_type = state.get("trigger_type", "")
    pattern = state.get("pattern", "none")
    risk_score = state.get("risk_score", 0.0)
    neigh = state.get("neighborhood_data", {})
    prior_fraud = neigh.get("prior_fraud_cases", 0)

    # Initial probability calibration
    if pattern == "card_testing":
        prob = 0.74
    elif trigger_type == "customer_report":
        prob = 0.65
    elif prior_fraud > 5:
        prob = 0.70
    elif trigger_type == "risk_score":
        prob = min(0.55, max(0.20, risk_score * 0.7))
    else:
        prob = 0.45

    # Rule R1 Check: If probability < 0.70 on weak/single signal, verify before block
    initial_actions = []
    if prob < 0.70 or trigger_type in ["risk_score", "customer_report"]:
        initial_actions.append({"action": "VERIFY_WITH_CUSTOMER", "route": "auto", "reason": "R1: assess weak/pending signal before block"})
        if pattern == "card_testing":
            initial_actions.insert(0, {"action": "DECLINE_TRANSACTION", "route": "L1", "reason": "R5: card testing velocity pattern detected"})
        else:
            initial_actions.append({"action": "STEP_UP_AUTH", "route": "auto", "reason": "R1: require step-up authentication pending verification"})
    else:
        initial_actions.append({"action": "DECLINE_TRANSACTION", "route": "L1", "reason": "R5: high-confidence pattern detected"})

    history = state.get("state_history", [])
    history.append("uncertainty_assessment")

    return {
        "initial_fraud_probability": round(prob, 2),
        "initial_actions": initial_actions,
        "step_count": state.get("step_count", 0) + 1,
        "state_history": history,
    }


def evidence_simulation(state: InvestigationState) -> Dict[str, Any]:
    trigger_type = state.get("trigger_type", "")
    pattern = state.get("pattern", "none")
    initial_prob = state.get("initial_fraud_probability", 0.5)
    flagged_txn_id = state.get("flagged_txn_id", "")
    card_id = state.get("card_id", "")
    customer_id = state.get("customer_id", "")
    opened_at = state.get("opened_at", "")
    window = state.get("window_data", {})
    neigh = state.get("neighborhood_data", {})
    claims = [e.get("claim", "") for e in state.get("evidence", [])]

    conn_cards = [str(c) for c in neigh.get("connected_cards", []) if str(c) != card_id]
    shared_devs = [str(d) for d in neigh.get("shared_devices", [])]
    exposure = float(window.get("exposure_usd", 0.0))
    if exposure <= 0.0:
        txn_attr = state.get("txn_attributes", {})
        exposure = float(txn_attr.get("attributes", {}).get("amount", 100.0) if isinstance(txn_attr, dict) else 100.0)

    # Policy Section 5 Simulation:
    # Most cases with prior fraud or customer report confirm fraud upon denial
    evidence_requests = []
    if trigger_type == "customer_report" or pattern == "card_testing" or neigh.get("prior_fraud_cases", 0) > 0:
        assumed = "Customer states they did not make these purchases and remained in possession of the card"
        evidence_requests.append({
            "type": "customer_validation",
            "asked_after_step": 3,
            "assumed_response": assumed
        })
        final_prob = min(0.96, initial_prob + 0.18)
        verdict = "fraud"
        status = "closed_fraud"
        what_changed = f"Customer denial confirmed unauthorized usage, raising fraud probability to {final_prob:.2f}."
    else:
        assumed = "Customer confirmed transaction was legitimate personal purchase"
        evidence_requests.append({
            "type": "customer_validation",
            "asked_after_step": 3,
            "assumed_response": assumed
        })
        final_prob = 0.08
        verdict = "legitimate"
        status = "closed_legitimate"
        what_changed = "Customer verified the authorization as legitimate, clearing the alert under Rule R3."

    # Determine Final Actions
    final_actions = []
    file_sar = False
    sar_reason = ""

    if verdict == "fraud":
        block_route = "L1" if exposure <= 2500 else "L2"
        final_actions.append({"action": "BLOCK_CARD", "route": block_route, "reason": f"R2: customer confirmed unauthorized use (exposure ${exposure:.2f})"})
        final_actions.append({"action": "CREATE_CASE", "route": "auto", "reason": "R2: create internal case record in graph"})

        if exposure > 1000 or conn_cards or pattern == "card_testing":
            file_sar = True
            sar_reason = "R2/R6: confirmed unauthorized use with exposure > $1,000 or linked cross-card entities"
            final_actions.append({"action": "FILE_REPORT", "route": "L2", "reason": sar_reason})

        if conn_cards:
            final_actions.append({"action": "MONITOR_CONNECTED_CARDS", "route": "auto", "reason": "R6: monitor connected cards sharing device/region"})
    else:
        final_actions.append({"action": "CLOSE_NO_FRAUD", "route": "auto", "reason": "R3: customer confirmed charge"})

    # Affected transactions
    affected_txns = window.get("txn_ids", [flagged_txn_id]) if verdict == "fraud" else []
    first_suspicious = affected_txns[0] if affected_txns else ""

    # Generate Summary & SAR narrative via Gemini
    summary = generate_case_summary(pattern, state.get("trigger_text", ""), verdict, exposure, claims)
    activity_date = opened_at.split(" ")[0] if " " in opened_at else opened_at

    sar_payload = {
        "file": file_sar,
        "reason": sar_reason if file_sar else "",
        "narrative": "",
        "subjects": [],
        "total_amount_usd": 0.0,
        "activity_dates": []
    }

    tokens = 0
    if file_sar:
        narrative = generate_sar_narrative(
            case_id=state.get("case_id", ""),
            customer_id=customer_id,
            cards=[card_id] + conn_cards[:2],
            amounts=exposure,
            dates=[activity_date, activity_date],
            channel="online" if "online" in state.get("trigger_text", "").lower() else "in_person",
            pattern=pattern,
            summary=summary,
            claims=claims,
        )
        sar_payload.update({
            "narrative": narrative,
            "subjects": [customer_id, card_id] + conn_cards[:2],
            "total_amount_usd": round(exposure, 2),
            "activity_dates": [activity_date, activity_date],
        })
        tokens += 450

    history = state.get("state_history", [])
    history.append("evidence_simulation")

    return {
        "final_fraud_probability": round(final_prob, 2),
        "verdict": verdict,
        "status": status,
        "what_changed": what_changed,
        "evidence_requests": evidence_requests,
        "final_actions": final_actions,
        "affected_txn_ids": affected_txns,
        "first_suspicious_txn_id": first_suspicious,
        "connected_card_ids": conn_cards[:3],
        "connected_device_profiles": shared_devs[:2],
        "exposure_usd": round(exposure, 2) if verdict == "fraud" else 0.0,
        "summary": summary,
        "sar": sar_payload,
        "stop_reason": "Customer response settled the investigation; policy actions determined.",
        "tokens": state.get("tokens", 0) + tokens,
        "step_count": state.get("step_count", 0) + 1,
        "state_history": history,
    }


def case_memory_writeback(state: InvestigationState) -> Dict[str, Any]:
    bridge = get_bridge()
    case_id = state.get("case_id", "")
    graph_case_id = f"CASE-{case_id}"

    bridge.write_investigation_case(
        case_id=graph_case_id,
        outcome=state.get("verdict", "uncertain"),
        pattern=state.get("pattern", "none"),
        exposure_usd=state.get("exposure_usd", 0.0),
        analyst_notes=state.get("summary", ""),
        card_id=state.get("card_id", ""),
        txn_ids=state.get("affected_txn_ids", []),
    )
    tool_calls = state.get("tool_calls", 0) + 1

    start_time = state.get("start_time", time.time())
    latency_s = round(time.time() - start_time, 2)

    history = state.get("state_history", [])
    history.append("case_memory_writeback")

    final_output = {
        "case_id": case_id,
        "case": {
            "status": state.get("status", "closed_fraud"),
            "verdict": state.get("verdict", "fraud"),
            "fraud_probability": state.get("final_fraud_probability", 0.9),
            "pattern": state.get("pattern", "none"),
            "pattern_description": state.get("pattern_description", ""),
            "affected_txn_ids": state.get("affected_txn_ids", []),
            "first_suspicious_txn_id": state.get("first_suspicious_txn_id", ""),
            "connected_card_ids": state.get("connected_card_ids", []),
            "connected_device_profiles": state.get("connected_device_profiles", []),
            "exposure_usd": state.get("exposure_usd", 0.0),
            "evidence": state.get("evidence", []),
            "similar_prior_cases": state.get("similar_prior_cases", []),
            "summary": state.get("summary", ""),
            "written_to_graph": True,
            "graph_case_id": graph_case_id,
        },
        "evidence_requests": state.get("evidence_requests", []),
        "next_best_actions": {
            "initial": state.get("initial_actions", []),
            "final": state.get("final_actions", []),
            "what_changed": state.get("what_changed", "nothing"),
        },
        "sar": state.get("sar", {
            "file": False, "reason": "", "narrative": "",
            "subjects": [], "total_amount_usd": 0.0, "activity_dates": []
        }),
        "stop_reason": state.get("stop_reason", "Investigation finished."),
        "tool_calls": tool_calls,
        "tokens": state.get("tokens", 0),
        "latency_s": latency_s,
    }

    return {
        "written_to_graph": True,
        "graph_case_id": graph_case_id,
        "tool_calls": tool_calls,
        "latency_s": latency_s,
        "final_output": final_output,
        "step_count": state.get("step_count", 0) + 1,
        "state_history": history,
    }
