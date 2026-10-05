import math

import pytest

pytest.importorskip("langgraph")

from agent import nodes, scoring  # noqa: E402
from graph_tools.tigergraph_mcp import GraphQueryError  # noqa: E402


class FakeBridge:
    def __init__(self, window=None, neigh=None, fail=False):
        self.window = window or {"total_txns": 1, "exposure_usd": 77.07, "micro_authorizations": 0,
                                 "large_purchases": 0, "is_card_testing": False, "txn_ids": ["T1"]}
        self.neigh = neigh or {"shared_devices": [], "connected_cards": [], "prior_fraud_cases": 0}
        self.fail = fail
        self.written = None

    def get_transaction(self, _):
        if self.fail:
            raise GraphQueryError("boom")
        return {"attributes": {"amount": 77.07}}

    def query_txn_window(self, *a, **k):
        return self.window

    def query_neighborhood(self, *a, **k):
        return self.neigh

    def match_historical_cases(self, **k):
        return []

    def write_investigation_case(self, **k):
        self.written = k
        return True


class FakeRetriever:
    def retrieve_guidance(self, *a, **k):
        return []


@pytest.fixture
def run(monkeypatch):
    from agent import llm
    from agent.graph import investigation_app

    # Keep tests hermetic: never call Gemini even when a key is present in .env.
    monkeypatch.setattr(llm, "_genai_client", None)

    def _run(case, bridge=None, **state):
        bridge = bridge or FakeBridge()
        monkeypatch.setattr(nodes, "_bridge", bridge)
        monkeypatch.setattr(nodes, "_retriever", FakeRetriever())
        monkeypatch.setattr(scoring, "model_signal", lambda _id: {"available": False, "reason": "test"})
        res = investigation_app.invoke({"raw_case": case, **state})
        return res, bridge
    return _run


RISK = {"case_id": "HHG-001", "opened_at": "2016-12-05 01:55:28", "trigger_type": "risk_score",
        "trigger_text": "Real-time model scored transaction 1 ($77.07, online) at 0.61. Review and decide.",
        "flagged_txn_id": "1", "card_id": "C1-K1", "customer_id": "C1", "risk_score": "0.61"}
REPORT = {**RISK, "case_id": "HHG-003", "trigger_type": "customer_report", "risk_score": float("nan"),
          "trigger_text": "Customer C1 message: 'I never made this $49.00 purchase.' Refers to 1."}


def test_nan_risk_score_does_not_poison_output(run):
    res, _ = run(REPORT)
    assert not math.isnan(res["risk_score"])
    import json
    json.dumps(res["final_output"], allow_nan=False)  # raises on NaN/inf


def test_unverified_risk_score_alert_is_cleared_when_customer_confirms(run):
    res, bridge = run(RISK)  # simulated reply -> confirmed
    out = res["final_output"]
    assert out["case"]["verdict"] == "legitimate"
    assert out["evidence_requests"][0]["simulated"] is True
    assert out["next_best_actions"]["final"][0]["action"] == "CLOSE_NO_FRAUD"
    assert bridge.written["outcome"] == "legitimate"
    assert bridge.written["opened_at"] == "2016-12-05 01:55:28"      # real dates, not a constant
    assert bridge.written["actions_taken"] == "CLOSE_NO_FRAUD"


def test_supplied_customer_response_overrides_simulation(run):
    res, _ = run(RISK, customer_response="denied")
    out = res["final_output"]
    assert out["case"]["verdict"] == "fraud"
    assert out["evidence_requests"][0]["simulated"] is False
    assert any(a["action"] == "BLOCK_CARD" for a in out["next_best_actions"]["final"])


def test_no_reply_is_uncertain_and_escalates_when_exposed(run):
    big = FakeBridge(window={"exposure_usd": 900.0, "micro_authorizations": 0, "large_purchases": 0, "txn_ids": ["T1"]})
    res, _ = run(REPORT, bridge=big, customer_response="no_reply")
    out = res["final_output"]
    assert out["case"]["verdict"] == "uncertain" and out["case"]["status"] == "pending_review"
    actions = [a["action"] for a in out["next_best_actions"]["final"]]
    assert "ESCALATE_TO_ANALYST" in actions and "BLOCK_CARD" not in actions


def test_recurring_charge_follows_r7_without_special_casing_case_ids(run):
    case = {**REPORT, "case_id": "HHG-777", "trigger_text": "Customer says: 'I dispute this $9.99 monthly subscription charge.'"}
    res, _ = run(case)
    actions = [a["action"] for a in res["final_output"]["next_best_actions"]["final"]]
    assert res["final_output"]["case"]["verdict"] == "legitimate"
    assert actions == ["CREATE_CASE", "VERIFY_WITH_CUSTOMER", "WARN_CUSTOMER"]


def test_card_testing_pattern_files_sar(run):
    bridge = FakeBridge(window={"exposure_usd": 1500.0, "micro_authorizations": 4, "large_purchases": 1,
                                "is_card_testing": True, "txn_ids": ["T1", "T2"]})
    res, _ = run(REPORT, bridge=bridge)
    out = res["final_output"]
    assert out["case"]["pattern"] == "card_testing" and out["sar"]["file"] is True
    assert out["tokens"] == 0  # no LLM configured -> no invented token count


def test_graph_failure_aborts_instead_of_investigating_on_empty_data(run):
    with pytest.raises(GraphQueryError):
        run(RISK, bridge=FakeBridge(fail=True))


def test_probability_breakdown_is_explainable(run):
    res, _ = run(REPORT, customer_response="denied")
    breakdown = res["final_output"]["case"]["probability_breakdown"]
    assert breakdown[0]["factor"].startswith("base")
    assert any("customer response" in b["factor"] for b in breakdown)


def test_scoring_math():
    assert scoring.verdict_for(0.7) == "fraud" and scoring.verdict_for(0.25) == "legitimate"
    assert scoring.verdict_for(0.5) == "uncertain"
    p, _ = scoring.apply_customer_response(0.5, "denied")
    q, _ = scoring.apply_customer_response(0.5, "confirmed")
    assert p > 0.9 and q < 0.1
