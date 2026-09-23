import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Database,
  Cpu,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { CaseDetail } from '../../types';

interface CaseHeaderProps {
  caseData: CaseDetail;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({ caseData }) => {
  const c = caseData.case;
  const trigger = caseData.trigger;
  const verdict = c.verdict;
  const exposure = c.exposure_usd || 0;
  const probPercent = Math.round((c.fraud_probability || 0) * 100);

  const getVerdictBadge = () => {
    if (verdict === 'fraud') {
      return (
        <span className="badge badge-fraud badge-pill">
          <ShieldAlert size={12} /> CONFIRMED FRAUD
        </span>
      );
    }
    if (verdict === 'legitimate') {
      return (
        <span className="badge badge-legitimate badge-pill">
          <ShieldCheck size={12} /> CLEARED LEGITIMATE
        </span>
      );
    }
    return (
      <span className="badge badge-uncertain badge-pill">
        <HelpCircle size={12} /> UNCERTAIN / REVIEW
      </span>
    );
  };

  const formatPattern = (pattern: string) => {
    if (!pattern || pattern === 'none') return 'No Known Pattern (Routine)';
    return pattern
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div
      className="card card-elevated"
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderLeft: verdict === 'fraud' ? '3px solid var(--risk-high)' : verdict === 'legitimate' ? '3px solid var(--risk-low)' : '3px solid var(--route-l2)',
      }}
    >
      {/* Top Row: Case ID, Badges, Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {caseData.case_id}
              </span>
              {getVerdictBadge()}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: probPercent > 70 ? 'var(--risk-high-bg)' : probPercent < 20 ? 'var(--risk-low-bg)' : 'var(--risk-medium-bg)',
                  color: probPercent > 70 ? 'var(--risk-high)' : probPercent < 20 ? 'var(--risk-low)' : 'var(--risk-medium)',
                  border: '1px solid',
                  borderColor: probPercent > 70 ? 'var(--risk-high-border)' : probPercent < 20 ? 'var(--risk-low-border)' : 'var(--risk-medium-border)',
                }}
              >
                {probPercent}% PROBABILITY
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Opened: <span className="mono" style={{ color: 'var(--text-primary)' }}>{trigger?.opened_at || '2016-12-05 01:55'}</span>
              </span>
              <span style={{ color: 'var(--border-active)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Customer: <span className="mono" style={{ color: 'var(--brand-tiger)', fontWeight: 600 }}>{trigger?.customer_id}</span>
              </span>
              <span style={{ color: 'var(--border-active)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Primary Card: <span className="mono" style={{ color: 'var(--text-primary)' }}>{trigger?.card_id}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Financial Exposure & Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Exposure Callout */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
              FRAUD EXPOSURE (USD)
            </div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: 800, color: exposure > 0 ? 'var(--risk-high)' : 'var(--text-secondary)' }}>
              ${exposure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ width: '1px', height: '36px', background: 'var(--border-default)' }} />

          {/* Agent Telemetry */}
          <div style={{ display: 'flex', gap: '14px', fontSize: '11px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={11} /> Latency
              </div>
              <div className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {caseData.latency_s}s
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Cpu size={11} /> Tool Calls
              </div>
              <div className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {caseData.tool_calls}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Database size={11} /> Graph Writeback
              </div>
              <div className="mono" style={{ fontWeight: 600, color: 'var(--risk-low)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                ✓ {c.graph_case_id || `CASE-${caseData.case_id}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-row: Trigger Reason & Typology */}
      <div
        style={{
          background: 'rgba(9, 14, 23, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: 'var(--bg-tag)',
              color: 'var(--brand-tiger)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              whiteSpace: 'nowrap',
            }}
          >
            TRIGGER: {trigger?.trigger_type.replace('_', ' ')}
          </span>
          <span style={{ fontSize: '11.5px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {trigger?.trigger_text || 'Automated risk scoring on authorization request.'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Typology:</span>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'var(--bg-card-elevated)',
              border: '1px solid var(--border-default)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {formatPattern(c.pattern)}
          </span>
        </div>
      </div>
    </div>
  );
};
