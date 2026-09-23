import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  DollarSign,
  Database,
  ArrowRight,
  Filter,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { CaseSummary } from '../../types';

interface CommandCenterProps {
  cases: CaseSummary[];
  onOpenCase: (caseId: string) => void;
  loading?: boolean;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ cases, onOpenCase, loading }) => {
  const [filter, setFilter] = useState<'all' | 'fraud' | 'legitimate' | 'approval_required'>('all');

  const totalCases = cases.length;
  const fraudCases = cases.filter((c) => c.verdict === 'fraud').length;
  const legitCases = cases.filter((c) => c.verdict === 'legitimate').length;
  const sarCases = cases.filter((c) => c.sar_filed).length;
  const totalExposure = cases.reduce((acc, c) => acc + (c.exposure_usd || 0), 0);
  const pendingApprovals = cases.filter((c) => c.approval?.status === 'pending').length;

  const filteredCases = cases.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'fraud') return c.verdict === 'fraud';
    if (filter === 'legitimate') return c.verdict === 'legitimate';
    if (filter === 'approval_required') return c.approval?.status === 'pending';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Overview */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(13, 21, 36, 0.8) 100%)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-auto badge-pill">TIGERGRAPH FRAUD OPS</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IEEE-CIS Hackathon Edition</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            Fraud Investigation Command Center
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '650px' }}>
            Real-time agentic triage queue running autonomous GraphRAG, subgraphs traversal, FinCEN SAR drafting, and policy-governed next-best actions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card-elevated)',
              border: '1px solid var(--border-default)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              EXPOSURE PREVENTED
            </div>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--risk-high)' }}>
              ${totalExposure.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}
      >
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>EXAM CASES</span>
            <Layers size={14} color="var(--brand-tiger)" />
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalCases}
          </div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>100% benchmarked</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CONFIRMED FRAUD</span>
            <ShieldAlert size={14} color="var(--risk-high)" />
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--risk-high)' }}>
            {fraudCases}
          </div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Card testing & CNP fraud</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CLEARED FALSE ALARMS</span>
            <ShieldCheck size={14} color="var(--risk-low)" />
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--risk-low)' }}>
            {legitCases}
          </div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Customer confirmed (Rule R3)</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>SAR REGULATORY FILINGS</span>
            <FileText size={14} color="var(--route-l2)" />
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--route-l2)' }}>
            {sarCases}
          </div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>FinCEN compliant narratives</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PENDING APPROVALS</span>
            <AlertTriangle size={14} color="var(--risk-medium)" />
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--risk-medium)' }}>
            {pendingApprovals}
          </div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>L1 / L2 sign-off required</span>
        </div>
      </div>

      {/* Triage Queue Table */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Table Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--brand-tiger)" />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              INVESTIGATION TRIAGE QUEUE ({filteredCases.length})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'fraud', 'legitimate', 'approval_required'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: filter === tab ? 'var(--brand-tiger)' : 'var(--border-default)',
                  background: filter === tab ? 'var(--bg-card-elevated)' : 'transparent',
                  color: filter === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>CASE ID</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>TRIGGER SOURCE</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>CUSTOMER / CARD</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>VERDICT</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>TYPOLOGY</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>EXPOSURE</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>RECOMMENDED NBA</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => {
                const primaryAction = c.final_actions?.[0] || { action: 'MONITOR_CARD', route: 'auto' };
                return (
                  <tr
                    key={c.case_id}
                    onClick={() => onOpenCase(c.case_id)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-tiger)' }}>
                        {c.case_id}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                        {c.trigger_type.replace('_', ' ')}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {c.customer_id}
                      </div>
                      <div className="mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {c.card_id}
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      {c.verdict === 'fraud' ? (
                        <span className="badge badge-fraud">FRAUD ({Math.round(c.fraud_probability * 100)}%)</span>
                      ) : (
                        <span className="badge badge-legitimate">LEGITIMATE</span>
                      )}
                    </td>

                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {c.pattern === 'none' ? '—' : c.pattern.replace(/_/g, ' ')}
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span className="mono" style={{ fontWeight: 700, color: c.exposure_usd > 0 ? 'var(--risk-high)' : 'var(--text-secondary)' }}>
                        ${c.exposure_usd.toFixed(2)}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mono" style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-primary)' }}>
                          {primaryAction.action}
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: 'var(--radius-sm)',
                            background: primaryAction.route === 'L2' ? 'var(--route-l2-bg)' : primaryAction.route === 'L1' ? 'var(--route-l1-bg)' : 'var(--route-auto-bg)',
                            color: primaryAction.route === 'L2' ? 'var(--route-l2)' : primaryAction.route === 'L1' ? 'var(--route-l1)' : 'var(--route-auto)',
                          }}
                        >
                          {primaryAction.route}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCase(c.case_id);
                        }}
                      >
                        <span>Inspect</span>
                        <ArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
