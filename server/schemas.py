"""Pydantic request/response contracts. Response models are lenient (extra fields allowed)
so the frontend contract is documented and validated without silently dropping data."""
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class _Lenient(BaseModel):
    model_config = ConfigDict(extra="allow")


class ApprovalRecord(_Lenient):
    status: str
    decision: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    action_name: Optional[str] = None
    route: Optional[str] = None
    analyst_role: Optional[str] = None
    notes: Optional[str] = None


class CaseSummary(_Lenient):
    case_id: str
    opened_at: str
    trigger_type: str
    trigger_text: str
    flagged_txn_id: str
    card_id: str
    customer_id: str
    risk_score: Optional[float] = None
    status: str
    verdict: str
    fraud_probability: float
    pattern: str
    exposure_usd: float
    sar_filed: bool
    sar_reason: str
    tool_calls: int
    tokens: int
    latency_s: float
    stop_reason: str
    evidence_count: int
    initial_actions: List[Dict[str, Any]]
    final_actions: List[Dict[str, Any]]
    what_changed: str
    approval: ApprovalRecord
    written_to_graph: bool
    graph_case_id: str


class AuditEvent(_Lenient):
    id: str
    timestamp: str
    case_id: Optional[str] = None
    actor: str
    actor_type: str
    action: str
    details: str = ""
    route: str = "auto"


class TransactionItem(_Lenient):
    txn_id: str
    case_id: str
    customer_id: str
    card_id: str
    timestamp: str
    amount: float
    channel: str
    risk_score: float
    trigger_type: str
    status: str


class TransactionPage(BaseModel):
    items: List[TransactionItem]
    total: int
    page: int
    limit: int


class PolicyChunk(_Lenient):
    id: str
    category: str
    title: str
    content: str


class ApprovalRequest(BaseModel):
    decision: Literal["approve", "reject", "request_evidence"]
    action_name: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_]+$")
    route: Literal["auto", "L1", "L2"]
    analyst_name: str = Field(default="", max_length=80)
    analyst_role: str = Field(default="L1", max_length=40)
    notes: Optional[str] = Field(default="", max_length=2000)


class ActionResponse(BaseModel):
    success: bool
    record: Dict[str, Any]


class RunRequest(BaseModel):
    """Optional real evidence. If omitted, the agent falls back to a clearly flagged simulated reply."""
    customer_response: Optional[Literal["confirmed", "denied", "no_reply"]] = None


class RunResponse(BaseModel):
    success: bool
    mode: Literal["agent", "replay"]
    data: Dict[str, Any]


class TrainRequest(BaseModel):
    max_rows: Optional[int] = Field(default=20000, ge=100)
    model_type: Literal["hist_gb", "random_forest", "logistic_regression"] = "hist_gb"
