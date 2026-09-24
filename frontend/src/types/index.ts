export type VerdictType = 'fraud' | 'legitimate' | 'uncertain';
export type PatternType = 
  | 'card_testing'
  | 'card_not_present_fraud'
  | 'card_not_present_new_device'
  | 'out_of_region_use'
  | 'account_takeover'
  | 'undocumented'
  | 'none';

export type TriggerType = 'risk_score' | 'customer_report' | 'analyst_request';

export type ApprovalRoute = 'auto' | 'L1' | 'L2';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_resolved';

export interface ActionItem {
  action: string;
  route: ApprovalRoute;
  reason: string;
}

export interface EvidenceItem {
  claim: string;
  source: 'graph' | 'document' | 'customer' | 'model' | 'external';
  ref: string;
  entity_ids: string[];
}

export interface EvidenceRequest {
  type: 'customer_validation' | 'step_up_auth' | 'analyst_info';
  asked_after_step: number;
  assumed_response: string;
}

export interface SARPayload {
  file: boolean;
  reason: string;
  narrative: string;
  subjects: string[];
  total_amount_usd: number;
  activity_dates: string[];
}

export interface CaseApproval {
  status: ApprovalStatus;
  decision: string | null;
  action_name?: string | null;
  route?: string | null;
  approved_by: string | null;
  analyst_role?: string | null;
  approved_at: string | null;
  notes?: string;
}

export interface CaseSummary {
  case_id: string;
  opened_at: string;
  trigger_type: TriggerType;
  trigger_text: string;
  flagged_txn_id: string;
  card_id: string;
  customer_id: string;
  risk_score: number | null;
  status: string;
  verdict: VerdictType;
  fraud_probability: number;
  pattern: PatternType;
  exposure_usd: number;
  sar_filed: boolean;
  sar_reason: string;
  tool_calls: number;
  tokens: number;
  latency_s: number;
  stop_reason: string;
  evidence_count: number;
  initial_actions: ActionItem[];
  final_actions: ActionItem[];
  what_changed: string;
  approval: CaseApproval;
  written_to_graph: boolean;
  graph_case_id: string;
}

export interface CaseDetail {
  case_id: string;
  trigger?: {
    opened_at: string;
    trigger_type: TriggerType;
    trigger_text: string;
    flagged_txn_id: string;
    card_id: string;
    customer_id: string;
    risk_score: number | null;
  };
  case: {
    status: string;
    verdict: VerdictType;
    fraud_probability: number;
    pattern: PatternType;
    pattern_description: string;
    affected_txn_ids: string[];
    first_suspicious_txn_id: string;
    connected_card_ids: string[];
    connected_device_profiles: string[];
    exposure_usd: number;
    evidence: EvidenceItem[];
    similar_prior_cases: string[];
    summary: string;
    written_to_graph: boolean;
    graph_case_id: string;
  };
  evidence_requests: EvidenceRequest[];
  next_best_actions: {
    initial: ActionItem[];
    final: ActionItem[];
    what_changed: string;
  };
  sar: SARPayload;
  stop_reason: string;
  tool_calls: number;
  tokens: number;
  latency_s: number;
  approval?: CaseApproval;
}

export interface GraphNode {
  id: string;
  type: 'Customer' | 'Card' | 'Transaction' | 'DeviceProfile' | 'ClosedCase' | 'LiveCase' | 'BillingRegion' | 'EmailDomain';
  label: string;
  attributes: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  attributes?: Record<string, any>;
}

export interface SubgraphData {
  case_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: {
    total_nodes: number;
    total_edges: number;
    connected_cards_count: number;
    shared_devices_count: number;
    prior_cases_count: number;
  };
}

export interface PolicyRule {
  id: string;
  category: 'rule' | 'pattern' | 'regulatory';
  rule_id: string;
  title: string;
  approval_route: string;
  content: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  case_id: string;
  actor: string;
  actor_type: 'analyst' | 'agent' | 'system';
  action: string;
  details: string;
  route: string;
}

export interface TransactionItem {
  txn_id: string;
  case_id: string;
  customer_id: string;
  card_id: string;
  timestamp: string;
  amount: number;
  channel: string;
  risk_score: number;
  trigger_type: string;
  status: string;
}
