import {
  CaseSummary,
  CaseDetail,
  SubgraphData,
  PolicyRule,
  AuditEvent,
  TransactionItem,
} from '../types';

// Dev: Vite proxies /api to localhost:8000. Production: set VITE_API_BASE to the backend URL (e.g. https://ringleader.onrender.com/api).
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

// Optional bearer token (set VITE_API_TOKEN in frontend/.env.local when the API has ANALYST_TOKENS enabled).
const API_TOKEN = import.meta.env.VITE_API_TOKEN as string | undefined;

function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (API_TOKEN) headers.set('Authorization', `Bearer ${API_TOKEN}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export async function fetchHealth(): Promise<any> {
  const res = await apiFetch(`/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function fetchCases(): Promise<CaseSummary[]> {
  const res = await apiFetch(`/cases`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function fetchCaseDetail(caseId: string): Promise<CaseDetail> {
  const res = await apiFetch(`/cases/${caseId}`);
  if (!res.ok) throw new Error(`Failed to fetch case ${caseId}`);
  return res.json();
}

export async function fetchCaseSubgraph(caseId: string): Promise<SubgraphData> {
  const res = await apiFetch(`/cases/${caseId}/subgraph`);
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
  const res = await apiFetch(`/cases/${caseId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit analyst action');
  return res.json();
}

export async function runCaseInvestigation(caseId: string): Promise<{ success: boolean; data: any }> {
  const res = await apiFetch(`/cases/${caseId}/run`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to run investigation for ${caseId}`);
  return res.json();
}

export async function fetchPolicies(): Promise<PolicyRule[]> {
  const res = await apiFetch(`/policies`);
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json();
}

export async function fetchAuditLog(limit: number = 50): Promise<AuditEvent[]> {
  const res = await apiFetch(`/audit-log?limit=${limit}`);
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

  const res = await apiFetch(`/transactions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}
