import sqlite3
import threading

import pytest

from server.audit_store import AuditStore


def ev(i, **kw):
    return {"case_id": "HHG-001", "actor": "tester", "actor_type": "analyst",
            "action": f"ACT_{i}", "details": f"event {i}", "route": "L1", **kw}


@pytest.fixture
def store(tmp_path):
    return AuditStore(tmp_path / "audit.db")


def test_chain_valid_and_ordered_newest_first(store):
    for i in range(5):
        store.append_event(ev(i))
    assert store.verify_chain()["valid"] is True
    assert store.verify_chain()["events"] == 5
    assert [e["action"] for e in store.list_events(limit=2)] == ["ACT_4", "ACT_3"]


def test_tampering_is_detected(store, tmp_path):
    for i in range(3):
        store.append_event(ev(i))
    conn = sqlite3.connect(tmp_path / "audit.db")
    conn.execute("DROP TRIGGER audit_no_update")  # attacker removes the guard...
    conn.execute("UPDATE audit_events SET details='forged' WHERE seq=2")  # ...and edits history
    conn.commit()
    result = store.verify_chain()
    assert result["valid"] is False and result["first_invalid_seq"] == 2


def test_update_and_delete_are_blocked(store, tmp_path):
    store.append_event(ev(1))
    conn = sqlite3.connect(tmp_path / "audit.db")
    with pytest.raises(sqlite3.DatabaseError):
        conn.execute("UPDATE audit_events SET details='x'")
    with pytest.raises(sqlite3.DatabaseError):
        conn.execute("DELETE FROM audit_events")


def test_concurrent_appends_lose_nothing(store):
    def worker(n):
        for i in range(10):
            store.append_event(ev(f"{n}-{i}"))
    threads = [threading.Thread(target=worker, args=(n,)) for n in range(8)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert store.verify_chain() == {**store.verify_chain(), "valid": True, "events": 80}
    assert len({e["id"] for e in store.list_events(limit=1000)}) == 80


def test_decision_and_event_commit_together(store):
    store.record_decision("HHG-001", {"status": "approved"}, ev(1))
    assert store.get_approval("HHG-001")["status"] == "approved"
    assert len(store.list_events()) == 1


def test_legacy_json_is_imported_once(tmp_path):
    import json
    legacy = tmp_path / "audit_log.json"
    legacy.write_text(json.dumps([{"id": "evt-001", "timestamp": "2026-01-01T00:00:00Z", "case_id": "HHG-001",
                                   "actor": "a", "actor_type": "system", "action": "X", "details": "d", "route": "auto"}]))
    appr = tmp_path / "appr.json"
    appr.write_text(json.dumps({"HHG-001": {"status": "approved"}}))
    AuditStore(tmp_path / "a.db", legacy, appr)
    s = AuditStore(tmp_path / "a.db", legacy, appr)  # second start must not duplicate
    assert len(s.list_events()) == 1 and s.get_approval("HHG-001")["status"] == "approved"
    assert s.verify_chain()["valid"]
