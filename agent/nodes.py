import math
import re
import time
from typing import Any, Dict, List

from agent import scoring
from agent.llm import generate_case_summary, generate_sar_narrative
from agent.state import InvestigationState
from graph_tools.tigergraph_mcp import TigerGraphMCPBridge
from graphrag.vector_indexer import get_graphrag_retriever

_bridge = None
_retriever = None

RECURRING_RE = re.compile(r"\b(subscription|recurring|renewal|monthly|annual|auto-?pay|membership)\b", re.I)


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


def _history(state: InvestigationState, node: str) -> List[str]:
    """Returns a NEW history list (never mutates the incoming state)."""
    return [*state.get("state_history", []), node]


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        out = float(value)
    except (TypeError, ValueError):
        return default
    return default if math.isnan(out) or math.isinf(out) else out


def trigger_ingestion(state: InvestigationState) -> Dict[str, Any]:
    raw = state.get("raw_case", {})
    return {
        "case_id": raw.get("case_id", "HHG-001"),
        "opened_at": str(raw.get("opened_at", "2016-12-05 01:55:28")),
        "trigger_type": str(raw.get("trigger_type", "risk_score")),
        "trigger_text": str(raw.get("trigger_text", "")),
        "flagged_txn_id": str(raw.get("flagged_txn_id", "3514030")),
        "card_id": str(raw.get("card_id", "C12382-K1")),
        "customer_id": str(raw.get("customer_id", "C12382")),
        "risk_score": _to_float(raw.get("risk_score")),
        "tool_calls": 0,
        "tokens": 0,
        "step_count": 1,
        "state_history": _history(state, "trigger_ingestion"),
        "start_time": time.time(),
    }


def initial_investigation(state: InvestigationState) -> Dict[str, Any]:
    bridge = get_bridge()

    # Graph failures raise GraphQueryError and abort the run: we never investigate on empty evidence.
    txn_attr = bridge.get_transaction(state["flagged_txn_id"])
    window_data = bridge.query_txn_window(state["card_id"], state["opened_at"], window_hours=24)
    neigh_data = bridge.query_neighborhood(state["flagged_txn_id"])

    # Model score on the full feature row of the flagged transaction
    model = scoring.model_signal(state["flagged_txn_id"])

    return {
        "txn_attributes": txn_attr,
        "window_data": window_data,
        "neighborhood_data": neigh_data,
        "model_signal": model,
        "tool_calls": state.get("tool_calls", 0) + 3,
        "step_count": state.get("step_count", 0) + 1,
        "state_history": _history(state, "initial_investigation"),
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
    model = state.get("model_signal", {})

    evidence = []
    pattern = "none"

    is_card_testing = window.get("is_card_testing", False) or (
        window.get("micro_authorizations", 0) >= 3 and window.get("large_purchases", 0) >= 1)
    if is_card_testing:
        pattern = "card_testing"
        evidence.append({
            "claim": f"{window.get('micro_authorizations', 0)} micro authorizations under $5 followed by larger purchase in window",
            "source": "graph",
            "ref": f"query:txn_window(card_id={card_id})",
            "entity_ids": window.get("txn_ids", [flagged_txn_id])[:4],
        })

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

    if trigger_type == "customer_report":
        if pattern == "none":
            pattern = "card_not_present_fraud"
        evidence.append({
            "claim": f"Cardholder explicitly disputed the transaction: '{trigger_text}'",
            "source": "customer",
            "ref": "trigger:customer_report",
            "entity_ids": [flagged_txn_id],
        })
    elif trigger_type == "analyst_request":
        if pattern == "none":
            pattern = "card_not_present_new_device"
        evidence.append({
            "claim": f"Analyst request flagged shared unusual device: '{trigger_text}'",
            "source": "external",
            "ref": "trigger:analyst_request",
            "entity_ids": [flagged_txn_id],
        })
    elif trigger_type == "risk_score" and pattern == "none":
        evidence.append({
            "claim": f"Real-time fraud model scored transaction at {risk_score:.2f} (weak single signal)",
            "source": "model",
            "ref": "trigger:risk_score",
            "entity_ids": [flagged_txn_id],
        })

    if model.get("available"):
        evidence.append({
            "claim": f"Trained fraud model scores this transaction at {model['probability']:.2f}",
            "source": "model",
            "ref": f"model:{model.get('model_version', 'unknown')}",
            "entity_ids": [flagged_txn_id],
        })

    retrieved_rules = retriever.retrieve_guidance(f"{pattern} {trigger_text}", top_k=3)
    similar_cases = bridge.match_historical_cases(pattern_filter=pattern if pattern != "none" else "", max_results=2)
    prior_case_ids = [c.get("v_id") for c in similar_cases if c.get("v_id")]

    return {
        "evidence": evidence,
        "pattern": pattern,
        "pattern_description": "",
        "retrieved_rules": retrieved_rules,
        "similar_prior_cases": prior_case_ids,
        "prior_case_details": similar_cases,
        "tool_calls": tool_calls + 2,
        "step_count": state.get("step_count", 0) + 1,
        "state_history": _history(state, "evidence_synthesis"),
    }


def uncertainty_assessment(state: InvestigationState) -> Dict[str, Any]:
    trigger_type = state.get("trigger_type", "")
    pattern = state.get("pattern", "none")
    neigh = state.get("neighborhood_data", {})

    prob, breakdown = scoring.initial_probability(
        trigger_type=trigger_type,
        trigger_risk=state.get("risk_score") or None,
        model=state.get("model_signal", {}),
        pattern=pattern,
        prior_fraud_cases=neigh.get("prior_fraud_cases", 0),
        connected_cards=len(neigh.get("connected_cards", [])),
    )

    # Policy R1: below 0.70 (or only a weak single signal) -> verify before any block.
    initial_actions = []
    if prob < scoring.FRAUD_THRESHOLD or trigger_type in ("risk_score", "customer_report"):
        initial_actions.append({"action": "VERIFY_WITH_CUSTOMER", "route": "auto",
                                "reason": "R1: assess weak/pending signal before block"})
        if pattern == "card_testing":
            initial_actions.insert(0, {"action": "DECLINE_TRANSACTION", "route": "L1",
                                       "reason": "R5: card testing velocity pattern detected"})
        else:
            initial_actions.append({"action": "STEP_UP_AUTH", "route": "auto",
                                    "reason": "R1: require step-up authentication pending verification"})
    else:
        initial_actions.append({"action": "DECLINE_TRANSACTION", "route": "L1",
                                "reason": "R5: high-confidence pattern detected"})

    return {
        "initial_fraud_probability": prob,
        "probability_breakdown": breakdown,
        "initial_actions": initial_actions,
        "step_count": state.get("step_count", 0) + 1,
        "state_history": _history(state, "uncertainty_assessment"),
    }


def _simulated_response(state: InvestigationState) -> str:
    """Stand-in for the customer's answer when none was supplied. Always flagged `simulated`."""
    neigh = state.get("neighborhood_data", {})
    if state.get("trigger_type") == "analyst_request":
        return "denied"
    if RECURRING_RE.search(state.get("trigger_text", "")):
        return "confirmed"  # disputed charge that matches a recurring pattern (policy R7)
    if (state.get("trigger_type") == "customer_report" or state.get("pattern") == "card_testing"
            or neigh.get("prior_fraud_cases", 0) > 0):
        return "denied"
    return "confirmed"


_RESPONSE_TEXT = {
    "denied": "Customer states they did not make these purchases and remained in possession of the card",
    "confirmed": "Customer confirmed the transaction was a legitimate purchase",
    "no_reply": "No customer reply received within 24 hours",
}


def evidence_simulation(state: InvestigationState) -> Dict[str, Any]:
    trigger_type = state.get("trigger_type", "")
    trigger_text = state.get("trigger_text", "")
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
    exposure = _to_float(window.get("exposure_usd"))
    if exposure <= 0.0:
        txn_attr = state.get("txn_attributes", {})
        exposure = _to_float(txn_attr.get("attributes", {}).get("amount") if isinstance(txn_attr, dict) else None, 100.0)

    # --- Customer / analyst evidence: real if supplied, otherwise a flagged simulation -----------
    supplied = state.get("customer_response")
    response = supplied or _simulated_response(state)
    simulated = supplied is None
    asked_type = "analyst_info" if trigger_type == "analyst_request" else "customer_validation"
    evidence_requests = [{
        "type": asked_type,
        "asked_after_step": 3,
        "response": response,
        "simulated": simulated,
        "assumed_response": _RESPONSE_TEXT[response] + (" (simulated)" if simulated else " (supplied by analyst)"),
    }]

    final_prob, delta = scoring.apply_customer_response(initial_prob, response)
    breakdown = [*state.get("probability_breakdown", []), delta]
    verdict = scoring.verdict_for(final_prob)
    recurring = bool(RECURRING_RE.search(trigger_text))

    # --- Policy actions ---------------------------------------------------------------------
    final_actions: List[Dict[str, str]] = []
    file_sar, sar_reason = False, ""

    if verdict == "fraud":
        status = "closed_fraud"
        what_changed = f"Customer response ({response}) moved fraud probability from {initial_prob:.2f} to {final_prob:.2f}."
        block_route = "L1" if exposure <= 2500 else "L2"
        final_actions.append({"action": "BLOCK_CARD", "route": block_route,
                              "reason": f"R2: unauthorized use confirmed (exposure ${exposure:.2f})"})
        final_actions.append({"action": "CREATE_CASE", "route": "auto", "reason": "R2: create internal case record in graph"})
        if exposure > 1000 or conn_cards or pattern == "card_testing":
            file_sar = True
            sar_reason = "R2/R6: confirmed unauthorized use with exposure > $1,000 or linked cross-card entities"
            final_actions.append({"action": "FILE_REPORT", "route": "L2", "reason": sar_reason})
        if conn_cards:
            final_actions.append({"action": "MONITOR_CONNECTED_CARDS", "route": "auto",
                                  "reason": "R6: monitor connected cards sharing device/region"})
    elif verdict == "legitimate":
        status = "closed_legitimate"
        what_changed = f"Customer response ({response}) cleared the alert; probability fell from {initial_prob:.2f} to {final_prob:.2f}."
        if recurring:
            what_changed = "Disputed charge matches a recurring subscription; customer advised under Rule R7."
            final_actions += [
                {"action": "CREATE_CASE", "route": "auto", "reason": "R7: record the dispute"},
                {"action": "VERIFY_WITH_CUSTOMER", "route": "auto", "reason": "R7: confirm recurring arrangement"},
                {"action": "WARN_CUSTOMER", "route": "auto", "reason": "R7: legitimate recurring charge; do not block"},
            ]
        else:
            final_actions.append({"action": "CLOSE_NO_FRAUD", "route": "auto", "reason": "R3: customer confirmed charge"})
    else:
        status = "pending_review"
        what_changed = (f"Evidence is inconclusive (probability {final_prob:.2f}); "
                        f"customer response: {response}. Escalated per policy.")
        final_actions.append({"action": "MONITOR_CARD", "route": "auto", "reason": "R4: monitor while evidence is outstanding"})
        if response == "no_reply":
            final_actions.append({"action": "DECLINE_TRANSACTION", "route": "L1",
                                  "reason": "R4: no reply within 24 hours; decline pending authorizations"})
        if exposure > 500:
            final_actions.append({"action": "ESCALATE_TO_ANALYST", "route": "L1",
                                  "reason": f"R8: uncertain verdict with exposure ${exposure:.2f} > $500"})

    at_risk = verdict != "legitimate"
    affected_txns = window.get("txn_ids", [flagged_txn_id]) if verdict == "fraud" else []
    first_suspicious = affected_txns[0] if affected_txns else ""

    summary = generate_case_summary(pattern, trigger_text, verdict, exposure, claims)
    activity_date = opened_at.split(" ")[0] if " " in opened_at else opened_at

    sar_payload = {"file": file_sar, "reason": sar_reason if file_sar else "", "narrative": "",
                   "subjects": [], "total_amount_usd": 0.0, "activity_dates": []}

    tokens = 0
    if file_sar:
        narrative, tokens = generate_sar_narrative(
            case_id=state.get("case_id", ""),
            customer_id=customer_id,
            cards=[card_id] + conn_cards[:2],
            amounts=exposure,
            dates=[activity_date, activity_date],
            channel="online" if "online" in trigger_text.lower() else "in_person",
            pattern=pattern,
            claims=claims,
        )
        sar_payload.update({
            "narrative": narrative,
            "subjects": [customer_id, card_id] + conn_cards[:2],
            "total_amount_usd": round(exposure, 2),
            "activity_dates": [activity_date, activity_date],
        })

    return {
        "final_fraud_probability": final_prob,
        "probability_breakdown": breakdown,
        "verdict": verdict,
        "status": status,
        "what_changed": what_changed,
        "evidence_requests": evidence_requests,
        "final_actions": final_actions,
        "affected_txn_ids": affected_txns,
        "first_suspicious_txn_id": first_suspicious,
        "connected_card_ids": conn_cards[:3],
        "connected_device_profiles": shared_devs[:2],
        "exposure_usd": round(exposure, 2) if at_risk else 0.0,
        "summary": summary,
        "sar": sar_payload,
        "stop_reason": ("Customer response settled the investigation; policy actions determined."
                        if verdict != "uncertain" else "Evidence inconclusive; escalated for analyst review."),
        "tokens": state.get("tokens", 0) + tokens,
        "step_count": state.get("step_count", 0) + 1,
        "state_history": _history(state, "evidence_simulation"),
    }


def case_memory_writeback(state: InvestigationState) -> Dict[str, Any]:
    bridge = get_bridge()
    case_id = state.get("case_id", "")
    graph_case_id = f"CASE-{case_id}"
    verdict = state.get("verdict", "uncertain")
    is_fraud = verdict == "fraud"
    pattern = state.get("pattern", "none") if is_fraud else "none"
    affected = state.get("affected_txn_ids", []) if is_fraud else []
    first_susp = state.get("first_suspicious_txn_id", "") if is_fraud else ""
    exposure = state.get("exposure_usd", 0.0)
    final_actions = state.get("final_actions", [])

    bridge.write_investigation_case(
        case_id=graph_case_id,
        outcome={"fraud": "confirmed_fraud", "legitimate": "legitimate"}.get(verdict, "uncertain"),
        pattern=pattern,
        exposure_usd=exposure,
        analyst_notes=state.get("summary", ""),
        card_id=state.get("card_id", ""),
        txn_ids=affected,
        opened_at=state.get("opened_at", ""),
        actions_taken="|".join(a["action"] for a in final_actions) or "NONE",
    )
    tool_calls = state.get("tool_calls", 0) + 1
    latency_s = round(time.time() - state.get("start_time", time.time()), 2)

    final_output = {
        "case_id": case_id,
        "case": {
            "status": state.get("status", "pending_review"),
            "verdict": verdict,
            "fraud_probability": state.get("final_fraud_probability", 0.0),
            "pattern": pattern,
            "pattern_description": state.get("pattern_description", ""),
            "affected_txn_ids": affected,
            "first_suspicious_txn_id": first_susp,
            "connected_card_ids": state.get("connected_card_ids", []),
            "connected_device_profiles": state.get("connected_device_profiles", []),
            "exposure_usd": exposure,
            "evidence": state.get("evidence", []),
            "similar_prior_cases": state.get("similar_prior_cases", []),
            "summary": state.get("summary", ""),
            "written_to_graph": True,
            "graph_case_id": graph_case_id,
            "probability_breakdown": state.get("probability_breakdown", []),
            "model_signal": state.get("model_signal", {}),
        },
        "evidence_requests": state.get("evidence_requests", []),
        "next_best_actions": {
            "initial": state.get("initial_actions", []),
            "final": final_actions,
            "what_changed": state.get("what_changed", "nothing"),
        },
        "sar": state.get("sar", {"file": False, "reason": "", "narrative": "",
                                 "subjects": [], "total_amount_usd": 0.0, "activity_dates": []}),
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
        "state_history": _history(state, "case_memory_writeback"),
    }
