import {
  CaseSummary,
  CaseDetail,
  SubgraphData,
  PolicyRule,
  AuditEvent,
  TransactionItem,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function fetchCases(): Promise<CaseSummary[]> {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function fetchCaseDetail(caseId: string): Promise<CaseDetail> {
  const res = await fetch(`${API_BASE}/cases/${caseId}`);
  if (!res.ok) throw new Error(`Failed to fetch case ${caseId}`);
  return res.json();
}

export async function fetchCaseSubgraph(caseId: string): Promise<SubgraphData> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/subgraph`);
  if (!res.ok) throw new Error(`Failed to fetch subgraph for ${caseId}`);
  return res.json();
}

export async function submitAnalystAction(
  caseId: string,
  payload: {
    decision: 'approve' | 'reject' | 'request_evidence';
    action_name: string;
    route: string;
    analyst_name: string;
    analyst_role: string;
    notes?: string;
  }
): Promise<{ success: boolean; record: any }> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit analyst action');
  return res.json();
}

export async function runCaseInvestigation(caseId: string): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/run`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to run investigation for ${caseId}`);
  return res.json();
}

export async function fetchPolicies(): Promise<PolicyRule[]> {
  const res = await fetch(`${API_BASE}/policies`);
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json();
}

export async function fetchAuditLog(limit: number = 50): Promise<AuditEvent[]> {
  const res = await fetch(`${API_BASE}/audit-log?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch audit log');
  return res.json();
}

export async function fetchTransactions(params?: {
  page?: number;
  limit?: number;
  min_risk?: number;
  channel?: string;
  card_id?: string;
}): Promise<{ items: TransactionItem[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.min_risk !== undefined) query.set('min_risk', params.min_risk.toString());
  if (params?.channel) query.set('channel', params.channel);
  if (params?.card_id) query.set('card_id', params.card_id);

  const res = await fetch(`${API_BASE}/transactions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}
