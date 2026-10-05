import pytest
from fastapi.testclient import TestClient

from server import auth, main
from server.audit_store import AuditStore


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "store", AuditStore(tmp_path / "audit.db"))
    monkeypatch.setattr(main, "investigation_app", None)
    monkeypatch.setattr(auth, "AUTH_ENABLED", False)
    return TestClient(main.app)


def action(**kw):
    return {"decision": "approve", "action_name": "BLOCK_CARD", "route": "L1",
            "analyst_name": "Sarah", "analyst_role": "L1 Team Lead", "notes": "ok", **kw}


def test_cases_contract_and_valid_json(client):
    r = client.get("/api/cases")
    assert r.status_code == 200
    cases = r.json()
    assert len(cases) == 20
    first = cases[0]
    for key in ("case_id", "verdict", "approval", "final_actions", "risk_score", "graph_case_id"):
        assert key in first
    assert any(c["risk_score"] is None for c in cases)  # NaN scores come back as null, not NaN


def test_invalid_case_id_rejected(client):
    assert client.get("/api/cases/..%2Fconfig").status_code in (404, 422)
    assert client.get("/api/cases/bad id!").status_code == 422
    assert client.get("/api/cases/HHG-999").status_code == 404


def test_action_validation(client):
    assert client.post("/api/cases/HHG-005/action", json=action(decision="maybe")).status_code == 422
    assert client.post("/api/cases/HHG-005/action", json=action(route="L9")).status_code == 422
    assert client.post("/api/cases/HHG-999/action", json=action()).status_code == 404


def test_action_records_approval_and_audit(client):
    r = client.post("/api/cases/HHG-005/action", json=action())
    assert r.status_code == 200 and r.json()["record"]["status"] == "approved"
    assert client.get("/api/cases/HHG-005").json()["approval"]["status"] == "approved"
    log = client.get("/api/audit-log").json()
    assert log[0]["action"] == "APPROVE_BLOCK_CARD" and log[0]["case_id"] == "HHG-005"
    assert client.get("/api/audit-log/verify").json()["valid"] is True


def test_request_evidence_keeps_case_pending(client):
    r = client.post("/api/cases/HHG-005/action", json=action(decision="request_evidence"))
    assert r.json()["record"]["status"] == "pending"


def test_l1_cannot_approve_l2_route(client):
    r = client.post("/api/cases/HHG-005/action", json=action(route="L2", action_name="FILE_REPORT"))
    assert r.status_code == 403
    ok = client.post("/api/cases/HHG-005/action",
                     json=action(route="L2", action_name="FILE_REPORT", analyst_role="L2 Fraud Manager"))
    assert ok.status_code == 200


def test_run_without_agent_is_honest_replay(client):
    r = client.post("/api/cases/HHG-005/run")
    assert r.status_code == 200 and r.json()["mode"] == "replay"
    top = client.get("/api/audit-log").json()[0]
    assert top["action"] == "INVESTIGATION_REPLAYED" and "No agent nodes were executed" in top["details"]


def test_transactions_amount_parsing_and_paging(client):
    r = client.get("/api/transactions?limit=5&page=2").json()
    assert r["total"] == 20 and len(r["items"]) == 5 and r["page"] == 2
    assert client.get("/api/transactions?min_risk=7").status_code == 422


def test_auth_enforced_when_tokens_configured(client, monkeypatch):
    monkeypatch.setattr(auth, "AUTH_ENABLED", True)
    monkeypatch.setattr(auth, "TOKENS", {"t-l1": {"name": "Sarah", "role": "L1"}, "t-l2": {"name": "Ravi", "role": "L2"}})
    assert client.get("/api/health").status_code == 200           # health stays open
    assert client.get("/api/cases").status_code == 401
    assert client.get("/api/cases", headers={"Authorization": "Bearer nope"}).status_code == 401
    l1 = {"Authorization": "Bearer t-l1"}
    l2 = {"Authorization": "Bearer t-l2"}
    assert client.get("/api/cases", headers=l1).status_code == 200
    # identity comes from the token, never from the body
    r = client.post("/api/cases/HHG-005/action", headers=l1, json=action(analyst_name="Mallory", analyst_role="L2"))
    assert r.json()["record"]["approved_by"] == "Sarah" and r.json()["record"]["identity_verified"] is True
    assert client.post("/api/cases/HHG-005/action", headers=l1,
                       json=action(route="L2", analyst_role="L2 Fraud Manager")).status_code == 403
    assert client.post("/api/cases/HHG-005/action", headers=l2, json=action(route="L2")).status_code == 200
    assert client.post("/api/model/train", headers=l1, json={}).status_code == 403


class _FakeApp:
    def __init__(self, exc=None):
        self.exc = exc

    def invoke(self, state):
        if self.exc:
            raise self.exc
        return {"state_history": ["a", "b"], "final_output": {
            "case": {"verdict": "fraud", "pattern": "card_testing"},
            "evidence_requests": [{"simulated": True}]}}


def test_run_with_agent_logs_real_node_count_and_simulation_flag(client, monkeypatch, tmp_path):
    from server import data_store
    monkeypatch.setattr(main, "investigation_app", _FakeApp())
    monkeypatch.setattr(data_store, "CASES_DIR", tmp_path)
    r = client.post("/api/cases/HHG-005/run", json={"customer_response": "denied"})
    assert r.status_code == 200 and r.json()["mode"] == "agent"
    top = client.get("/api/audit-log").json()[0]
    assert top["action"] == "INVESTIGATION_COMPLETED" and "Ran 2 nodes" in top["details"] and "simulated" in top["details"]


def test_run_maps_graph_errors_to_502(client, monkeypatch):
    monkeypatch.setattr(main, "investigation_app", _FakeApp(main.GraphQueryError("tg down")))
    assert client.post("/api/cases/HHG-005/run").status_code == 502
    monkeypatch.setattr(main, "investigation_app", _FakeApp(ValueError("bug")))
    assert client.post("/api/cases/HHG-005/run").status_code == 500


def test_run_rejects_bad_customer_response(client):
    assert client.post("/api/cases/HHG-005/run", json={"customer_response": "maybe"}).status_code == 422


def test_training_runs_in_background_and_rejects_parallel_jobs(client, monkeypatch):
    monkeypatch.setattr(main, "_train_worker", lambda job_id, req: None)  # don't actually train
    monkeypatch.setattr(main, "_train_jobs", {})
    r = client.post("/api/model/train", json={"max_rows": 500})
    assert r.status_code == 202 and r.json()["status"] == "running"
    assert client.post("/api/model/train", json={}).status_code == 409      # one job at a time
    assert client.get(f"/api/model/train/{r.json()['job_id']}").status_code == 200
    assert client.post("/api/model/train", json={"model_type": "bogus"}).status_code in (409, 422)
