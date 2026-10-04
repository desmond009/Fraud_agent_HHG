"""Probability calibration helpers for the investigation agent.

Everything here is deterministic and returns a human-readable breakdown, so each probability
shown to an analyst can be explained term by term (log-odds adjustments).
"""
import math
import threading
from typing import Any, Dict, List, Optional, Tuple

BASE_RATE = 0.05          # prior when neither a model score nor a trigger score exists
FRAUD_THRESHOLD = 0.70    # at/above: fraud (policy R1 uses 0.70)
LEGIT_THRESHOLD = 0.25    # at/below: legitimate; in between: uncertain

# Log-odds adjustments. Customer statements are decisive (policy R2/R3); graph signals are strong
# but circumstantial; a bare customer/analyst trigger is only a weak prior.
DELTAS = {
    "card_testing": 1.6,
    "customer_report_trigger": 2.0,
    "analyst_request_trigger": 2.0,
    "customer_denied": 4.0,
    "customer_confirmed": -4.0,
    "no_reply": 0.0,
}

_predictor = None
_store = None
_lock = threading.Lock()


def logit(p: float) -> float:
    p = min(max(p, 1e-4), 1 - 1e-4)
    return math.log(p / (1 - p))


def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def clamp(p: float, lo: float = 0.02, hi: float = 0.98) -> float:
    return min(max(p, lo), hi)


def model_signal(txn_id: str) -> Dict[str, Any]:
    """Scores the flagged transaction with the trained model using its full feature row."""
    global _predictor, _store
    try:
        with _lock:
            if _predictor is None:
                from training.predictor import FraudPredictor
                from training.txn_lookup import TransactionFeatureStore
                _predictor, _store = FraudPredictor(), TransactionFeatureStore()
        if not _predictor.is_loaded:
            return {"available": False, "reason": "no trained checkpoint"}
        row = _store.get_row(txn_id)
        if row is None:
            return {"available": False, "reason": f"transaction {txn_id} not found in feature store"}
        return {
            "available": True,
            "probability": round(_predictor.score_row(row), 4),
            "model_version": _predictor.metadata.get("trained_at", "unknown"),
        }
    except Exception as e:  # model scoring is an enrichment; failure must be visible, not fatal
        return {"available": False, "reason": f"{type(e).__name__}: {e}"}


def initial_probability(
    trigger_type: str,
    trigger_risk: Optional[float],
    model: Dict[str, Any],
    pattern: str,
    prior_fraud_cases: int,
    connected_cards: int,
) -> Tuple[float, List[Dict[str, Any]]]:
    breakdown: List[Dict[str, Any]] = []
    scores = []
    if trigger_risk:
        scores.append(("trigger risk score", trigger_risk))
    if model.get("available"):
        scores.append(("fraud model", model["probability"]))
    if scores:
        base = sum(s for _, s in scores) / len(scores)
        breakdown.append({"factor": "base: " + " + ".join(n for n, _ in scores) + " (mean)",
                          "value": round(base, 3), "log_odds_delta": None})
    else:
        base = BASE_RATE
        breakdown.append({"factor": "base: portfolio base rate (no score available)", "value": base,
                          "log_odds_delta": None})
    x = logit(clamp(base))

    def add(factor: str, delta: float):
        nonlocal x
        x += delta
        breakdown.append({"factor": factor, "log_odds_delta": round(delta, 2)})

    if pattern == "card_testing":
        add("card-testing velocity pattern (R5)", DELTAS["card_testing"])
    if prior_fraud_cases > 0 and connected_cards > 1:
        add(f"device/region cluster: {connected_cards} cards, {prior_fraud_cases} prior fraud cases (R6)",
            round(min(2.0, 0.6 + 0.4 * math.log1p(prior_fraud_cases)), 2))
    if trigger_type == "customer_report":
        add("unverified customer dispute", DELTAS["customer_report_trigger"])
    elif trigger_type == "analyst_request":
        add("analyst-flagged device", DELTAS["analyst_request_trigger"])
    return round(clamp(sigmoid(x)), 2), breakdown


def apply_customer_response(initial: float, response: str) -> Tuple[float, Dict[str, Any]]:
    delta = DELTAS[{"denied": "customer_denied", "confirmed": "customer_confirmed", "no_reply": "no_reply"}[response]]
    final = round(clamp(sigmoid(logit(initial) + delta)), 2)
    return final, {"factor": f"customer response: {response}", "log_odds_delta": delta}


def verdict_for(probability: float) -> str:
    if probability >= FRAUD_THRESHOLD:
        return "fraud"
    if probability <= LEGIT_THRESHOLD:
        return "legitimate"
    return "uncertain"
