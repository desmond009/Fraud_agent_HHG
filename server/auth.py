"""Bearer-token authentication and L1/L2 role enforcement.

Configure real users with ANALYST_TOKENS, a JSON object:
    {"<secret-token>": {"name": "Sarah Lin", "role": "L1"}, "<other>": {"name": "Ravi", "role": "L2"}}

When ANALYST_TOKENS is set, every /api route (except /api/health) requires
`Authorization: Bearer <token>` and the analyst identity/role comes from the token,
never from the request body. When it is unset the server runs in DEV MODE: routes are
open and a warning is logged at startup, so local demos keep working.
"""
import hmac
import json
import logging
import os
from dataclasses import dataclass
from typing import Dict, Optional

from fastapi import Depends, HTTPException, Request

logger = logging.getLogger("ringleader.auth")

ROLE_RANK = {"L1": 1, "L2": 2}


def normalize_role(value: Optional[str]) -> str:
    """'L2 Fraud Manager' -> 'L2'; anything else -> 'L1'."""
    return "L2" if value and "L2" in value.upper() else "L1"


@dataclass(frozen=True)
class Analyst:
    name: str
    role: str  # "L1" | "L2"
    authenticated: bool


def _load_tokens() -> Dict[str, Dict[str, str]]:
    raw = os.getenv("ANALYST_TOKENS", "").strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        return {str(t): {"name": str(v["name"]), "role": normalize_role(v.get("role"))} for t, v in data.items()}
    except Exception as e:
        raise RuntimeError(f"ANALYST_TOKENS is not valid JSON of {{token: {{name, role}}}}: {e}")


TOKENS = _load_tokens()
AUTH_ENABLED = bool(TOKENS)
if not AUTH_ENABLED:
    logger.warning("ANALYST_TOKENS not set: running in DEV MODE with NO authentication.")


def _lookup(token: str) -> Optional[Dict[str, str]]:
    found = None
    for known, info in TOKENS.items():  # constant-time compare against every token
        if hmac.compare_digest(known.encode(), token.encode()):
            found = info
    return found


def current_analyst(request: Request) -> Optional[Analyst]:
    """Returns the authenticated analyst, or None in dev mode."""
    if not AUTH_ENABLED:
        return None
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    info = _lookup(token.strip()) if scheme.lower() == "bearer" and token else None
    if not info:
        raise HTTPException(status_code=401, detail="Missing or invalid bearer token",
                            headers={"WWW-Authenticate": "Bearer"})
    return Analyst(name=info["name"], role=info["role"], authenticated=True)


def require_role(minimum: str):
    """Dependency factory: 403 unless the authenticated analyst has at least `minimum` role."""
    def dep(analyst: Optional[Analyst] = Depends(current_analyst)) -> Optional[Analyst]:
        if analyst is not None and ROLE_RANK[analyst.role] < ROLE_RANK[minimum]:
            raise HTTPException(status_code=403, detail=f"{minimum} role required")
        return analyst
    return dep


def cors_origins() -> list:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]
