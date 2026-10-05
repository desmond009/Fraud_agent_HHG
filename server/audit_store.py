"""Append-only, hash-chained audit ledger and approval store backed by SQLite.

Every audit event stores the SHA-256 of its own canonical content plus the hash of the
previous event, so any edit, deletion or reordering of history is detectable by
`verify_chain()`. SQLite triggers additionally reject UPDATE/DELETE on the ledger.
Writes use `BEGIN IMMEDIATE`, so concurrent requests serialize instead of losing events.
"""
import hashlib
import json
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

GENESIS_HASH = "0" * 64
_FIELDS = ("id", "timestamp", "case_id", "actor", "actor_type", "action", "details", "route")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS audit_events (
    seq        INTEGER PRIMARY KEY AUTOINCREMENT,
    id         TEXT NOT NULL UNIQUE,
    timestamp  TEXT NOT NULL,
    case_id    TEXT,
    actor      TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    action     TEXT NOT NULL,
    details    TEXT NOT NULL DEFAULT '',
    route      TEXT NOT NULL DEFAULT 'auto',
    origin     TEXT NOT NULL DEFAULT 'live',
    prev_hash  TEXT NOT NULL,
    hash       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_case ON audit_events(case_id);
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_events
BEGIN SELECT RAISE(ABORT, 'audit ledger is append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_events
BEGIN SELECT RAISE(ABORT, 'audit ledger is append-only'); END;

CREATE TABLE IF NOT EXISTS approvals (
    case_id      TEXT PRIMARY KEY,
    record_json  TEXT NOT NULL
);
"""


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def _event_hash(prev_hash: str, event: Dict[str, Any]) -> str:
    payload = json.dumps({k: event.get(k) for k in _FIELDS}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256((prev_hash + payload).encode("utf-8")).hexdigest()


class AuditStore:
    def __init__(self, db_path: Path, legacy_audit_json: Optional[Path] = None,
                 legacy_approvals_json: Optional[Path] = None):
        self.db_path = Path(db_path)
        self._lock = threading.Lock()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.executescript(_SCHEMA)
        self._migrate_legacy(legacy_audit_json, legacy_approvals_json)

    # -- connection -----------------------------------------------------------------
    @contextmanager
    def _connect(self):
        conn = sqlite3.connect(self.db_path, timeout=15, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        try:
            yield conn
        finally:
            conn.close()

    @contextmanager
    def _write(self):
        """Serialized write transaction (in-process lock + SQLite write lock)."""
        with self._lock, self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            try:
                yield conn
                conn.execute("COMMIT")
            except Exception:
                conn.execute("ROLLBACK")
                raise

    # -- ledger ---------------------------------------------------------------------
    def _append(self, conn, event: Dict[str, Any], origin: str = "live") -> Dict[str, Any]:
        row = conn.execute("SELECT seq, hash FROM audit_events ORDER BY seq DESC LIMIT 1").fetchone()
        prev_hash = row["hash"] if row else GENESIS_HASH
        next_seq = (row["seq"] if row else 0) + 1
        event = dict(event)
        event.setdefault("id", f"evt-{next_seq:05d}")
        event.setdefault("timestamp", utc_now_iso())
        event.setdefault("details", "")
        event.setdefault("route", "auto")
        digest = _event_hash(prev_hash, event)
        conn.execute(
            "INSERT INTO audit_events (id,timestamp,case_id,actor,actor_type,action,details,route,origin,prev_hash,hash)"
            " VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (event["id"], event["timestamp"], event.get("case_id"), event["actor"], event["actor_type"],
             event["action"], event["details"], event["route"], origin, prev_hash, digest),
        )
        return {**{k: event.get(k) for k in _FIELDS}, "hash": digest}

    def append_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        with self._write() as conn:
            return self._append(conn, event)

    def list_events(self, limit: int = 50, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
        sql = "SELECT id,timestamp,case_id,actor,actor_type,action,details,route FROM audit_events"
        args: List[Any] = []
        if case_id:
            sql += " WHERE case_id = ?"
            args.append(case_id)
        sql += " ORDER BY seq DESC LIMIT ?"
        args.append(limit)
        with self._connect() as conn:
            return [dict(r) for r in conn.execute(sql, args).fetchall()]

    def verify_chain(self) -> Dict[str, Any]:
        prev = GENESIS_HASH
        count = 0
        with self._connect() as conn:
            for row in conn.execute("SELECT * FROM audit_events ORDER BY seq ASC"):
                expected = _event_hash(prev, dict(row))
                if row["prev_hash"] != prev or row["hash"] != expected:
                    return {"valid": False, "events": count, "first_invalid_seq": row["seq"]}
                prev = row["hash"]
                count += 1
        return {"valid": True, "events": count, "head_hash": prev, "first_invalid_seq": None}

    # -- approvals ------------------------------------------------------------------
    def get_approvals(self) -> Dict[str, Dict[str, Any]]:
        with self._connect() as conn:
            return {r["case_id"]: json.loads(r["record_json"])
                    for r in conn.execute("SELECT case_id, record_json FROM approvals")}

    def get_approval(self, case_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute("SELECT record_json FROM approvals WHERE case_id=?", (case_id,)).fetchone()
        return json.loads(row["record_json"]) if row else None

    def record_decision(self, case_id: str, record: Dict[str, Any], event: Dict[str, Any]) -> Dict[str, Any]:
        """Persist the approval and its audit event in one atomic transaction."""
        with self._write() as conn:
            conn.execute(
                "INSERT INTO approvals (case_id, record_json) VALUES (?, ?) "
                "ON CONFLICT(case_id) DO UPDATE SET record_json=excluded.record_json",
                (case_id, json.dumps(record)),
            )
            return self._append(conn, event)

    # -- one-time import of the old JSON files --------------------------------------
    def _migrate_legacy(self, audit_json: Optional[Path], approvals_json: Optional[Path]):
        with self._connect() as conn:
            empty_audit = conn.execute("SELECT COUNT(*) c FROM audit_events").fetchone()["c"] == 0
            empty_appr = conn.execute("SELECT COUNT(*) c FROM approvals").fetchone()["c"] == 0
        if audit_json and Path(audit_json).exists() and empty_audit:
            try:
                events = json.loads(Path(audit_json).read_text())
            except Exception:
                events = []
            with self._write() as conn:
                for ev in events:
                    try:
                        self._append(conn, {k: ev.get(k) for k in _FIELDS if ev.get(k) is not None}, origin="legacy_import")
                    except sqlite3.IntegrityError:
                        continue
        if approvals_json and Path(approvals_json).exists() and empty_appr:
            try:
                data = json.loads(Path(approvals_json).read_text())
            except Exception:
                data = {}
            with self._write() as conn:
                for cid, rec in data.items():
                    conn.execute("INSERT OR IGNORE INTO approvals (case_id, record_json) VALUES (?, ?)",
                                 (cid, json.dumps(rec)))
