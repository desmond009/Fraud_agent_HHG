"""Cached, validated access to the case pack CSV and per-case deliverable JSON files."""
import json
import math
import re
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import HTTPException

from config import DATA_DIR, PROJECT_ROOT

CASES_DIR = PROJECT_ROOT / "cases"
CASE_PACK_FILE = DATA_DIR / "case_pack.csv"
CASE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$")

_lock = threading.Lock()
_pack_cache: Dict[str, Any] = {"mtime": None, "rows": []}
_case_cache: Dict[str, Any] = {}


def valid_case_id(case_id: str) -> str:
    """Rejects anything that is not a plain identifier (blocks path traversal)."""
    if not CASE_ID_RE.match(case_id):
        raise HTTPException(status_code=422, detail="Invalid case_id")
    return case_id


def clean(value: Any) -> Any:
    """NaN/inf/'—' -> None so output is always valid JSON."""
    if value is None:
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    if isinstance(value, str) and value.strip() in ("", "—", "nan", "NaN"):
        return None
    return value


def to_float(value: Any) -> Optional[float]:
    value = clean(value)
    if value is None:
        return None
    try:
        out = float(value)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(out) or math.isinf(out) else out


def get_case_pack() -> List[Dict[str, Any]]:
    if not CASE_PACK_FILE.exists():
        raise HTTPException(status_code=404, detail="case_pack.csv not found")
    mtime = CASE_PACK_FILE.stat().st_mtime
    with _lock:
        if _pack_cache["mtime"] != mtime:
            df = pd.read_csv(CASE_PACK_FILE, dtype=str, keep_default_na=False)
            _pack_cache["rows"] = [{k: clean(v) for k, v in row.items()} for row in df.to_dict("records")]
            _pack_cache["mtime"] = mtime
        return _pack_cache["rows"]


def get_pack_row(case_id: str) -> Optional[Dict[str, Any]]:
    return next((r for r in get_case_pack() if r.get("case_id") == case_id), None)


def case_file(case_id: str) -> Path:
    return CASES_DIR / f"{valid_case_id(case_id)}.json"


def load_case(case_id: str, missing_ok: bool = False) -> Dict[str, Any]:
    path = case_file(case_id)
    if not path.exists():
        if missing_ok:
            return {}
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    mtime = path.stat().st_mtime
    with _lock:
        cached = _case_cache.get(case_id)
        if cached and cached[0] == mtime:
            return cached[1]
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError:
        if missing_ok:
            return {}
        raise HTTPException(status_code=500, detail=f"Case file {case_id} is corrupt")
    with _lock:
        _case_cache[case_id] = (mtime, data)
    return data


def save_case(case_id: str, data: Dict[str, Any]) -> None:
    path = case_file(case_id)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, indent=2, allow_nan=False))
    tmp.replace(path)  # atomic
    with _lock:
        _case_cache.pop(case_id, None)
