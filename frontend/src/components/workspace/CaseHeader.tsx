import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Database,
  Cpu,
  Clock,
  FileText,
  CreditCard,
  User,
  Fingerprint,
} from 'lucide-react';
import { CaseDetail } from '../../types';

interface CaseHeaderProps {
  caseData: CaseDetail;
  onOpenSAR?: () => void;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({ caseData, onOpenSAR }) => {
  const c = caseData.case;
  const trigger = caseData.trigger;
  const verdict = c.verdict;
  const exposure = c.exposure_usd || 0;
  const probPercent = Math.round((c.fraud_probability || 0) * 100);

  const getVerdictBadge = () => {
    if (verdict === 'fraud') {
      return (
        <span
          className="badge-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--risk-high-bg)',
            color: 'var(--risk-high)',
            border: '1px solid var(--risk-high-border)',
          }}
        >
          <ShieldAlert size={12} /> CONFIRMED FRAUD
        </span>
      );
    }
    if (verdict === 'legitimate') {
      return (
        <span
          className="badge-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--risk-low-bg)',
            color: 'var(--risk-low)',
            border: '1px solid var(--risk-low-border)',
          }}
        >
          <ShieldCheck size={12} /> CLEARED LEGITIMATE
        </span>
      );
    }
    return (
      <span
        className="badge-pill"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--risk-medium-bg)',
          color: 'var(--risk-medium)',
          border: '1px solid var(--risk-medium-border)',
        }}
      >
        <HelpCircle size={12} /> UNCERTAIN / REVIEW
      </span>
    );
  };

  const formatPattern = (pattern: string) => {
    if (!pattern || pattern === 'none') return 'Routine Transaction';
    return pattern
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderLeft:
          verdict === 'fraud'
            ? '3px solid var(--risk-high)'
            : verdict === 'legitimate'
            ? '3px solid var(--risk-low)'
            : '3px solid var(--route-l2)',
      }}
    >
      {/* Top Row: Case ID, Risk Badges, Financial Exposure & Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        {/* Left Side: ID & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {caseData.case_id}
          </span>
          {getVerdictBadge()}
          <span
            className="mono"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              background: probPercent >= 70 ? 'var(--risk-high-bg)' : probPercent <= 30 ? 'var(--risk-low-bg)' : 'var(--risk-medium-bg)',
              color: probPercent >= 70 ? 'var(--risk-high)' : probPercent <= 30 ? 'var(--risk-low)' : 'var(--risk-medium)',
              border: `1px solid ${probPercent >= 70 ? 'var(--risk-high-border)' : probPercent <= 30 ? 'var(--risk-low-border)' : 'var(--risk-medium-border)'}`,
            }}
          >
            {probPercent}% RISK
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {c.status || 'Active'}
          </span>
        </div>

        {/* Right Side: Exposure & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700 }}>
              Total Exposure
            </div>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: exposure > 0 ? 'var(--risk-high)' : 'var(--text-primary)' }}>
              ${exposure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
          </div>

          {caseData.sar?.file && onOpenSAR && (
            <button
              onClick={onOpenSAR}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: 'var(--brand-tiger-hover)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FileText size={13} />
              <span>FinCEN SAR Ready</span>
            </button>
          )}

          {/* Micro Telemetry */}
          <div style={{ display: 'flex', gap: '10px', borderLeft: '1px solid var(--border-default)', paddingLeft: '14px', fontSize: '11px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}>
                <Clock size={10} /> Latency
              </div>
              <div className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {caseData.latency_s}s
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}>
                <Cpu size={10} /> Tools
              </div>
              <div className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {caseData.tool_calls}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}>
                <Database size={10} /> Graph Write
              </div>
              <div className="mono" style={{ fontWeight: 700, color: 'var(--risk-low)' }}>
                ✓ Sync
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-row: Trigger Reason, Entity IDs & Typology */}
      <div
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
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
              color: 'var(--brand-tiger-hover)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              whiteSpace: 'nowrap',
            }}
          >
            TRIGGER: {trigger?.trigger_type.replace('_', ' ')}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {trigger?.trigger_text || 'Automated risk scoring on authorization request.'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}>
            <User size={12} color="var(--text-muted)" />
            <span className="mono" style={{ color: 'var(--brand-tiger)', fontWeight: 600 }}>{trigger?.customer_id}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}>
            <CreditCard size={12} color="var(--text-muted)" />
            <span className="mono" style={{ color: 'var(--text-primary)' }}>{trigger?.card_id}</span>
          </div>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {formatPattern(c.pattern)}
          </div>
        </div>
      </div>
    </div>
  );
};
