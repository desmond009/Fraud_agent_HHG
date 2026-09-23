from typing import TypedDict, List, Dict, Any, Optional


class InvestigationState(TypedDict, total=False):
    # Trigger Inputs
    raw_case: Dict[str, Any]
    case_id: str
    flagged_txn_id: str
    card_id: str
    customer_id: str
    opened_at: str
    trigger_type: str
    trigger_text: str
    risk_score: float

    # Execution telemetry
    tool_calls: int
    tokens: int
    step_count: int
    state_history: List[str]
    start_time: float
    latency_s: float

    # Graph Investigation Data (MCP)
    txn_attributes: Dict[str, Any]
    window_data: Dict[str, Any]
    neighborhood_data: Dict[str, Any]
    similar_prior_cases: List[str]
    prior_case_details: List[Dict[str, Any]]

    # Evidence & Policies (GraphRAG)
    evidence: List[Dict[str, Any]]
    retrieved_rules: List[Dict[str, Any]]

    # Probability & Deliberation
    initial_fraud_probability: float
    final_fraud_probability: float
    initial_actions: List[Dict[str, str]]
    final_actions: List[Dict[str, str]]
    what_changed: str
    evidence_requests: List[Dict[str, Any]]

    # Final Verdict & Answer Formats
    status: str
    verdict: str
    pattern: str
    pattern_description: str
    affected_txn_ids: List[str]
    first_suspicious_txn_id: str
    connected_card_ids: List[str]
    connected_device_profiles: List[str]
    exposure_usd: float
    summary: str
    stop_reason: str
    sar: Dict[str, Any]
    written_to_graph: bool
    graph_case_id: str

    # Compiled deliverable
    final_output: Dict[str, Any]
