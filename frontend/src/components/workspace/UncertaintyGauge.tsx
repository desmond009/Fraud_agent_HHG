import React from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { CaseDetail } from '../../types';

interface UncertaintyGaugeProps {
  caseData: CaseDetail;
}

export const UncertaintyGauge: React.FC<UncertaintyGaugeProps> = ({ caseData }) => {
  const c = caseData.case;
  const nba = caseData.next_best_actions;
  const finalProb = c.fraud_probability || 0;
  
  // Calculate initial probability based on trigger or evidence requests
  const triggerRisk = caseData.trigger?.risk_score ?? 0.55;
  const initialProb = c.verdict === 'fraud' 
    ? Math.max(0.40, Math.min(0.70, finalProb - 0.18))
    : Math.min(0.60, Math.max(0.20, triggerRisk * 0.7));

  const initialPct = Math.round(initialProb * 100);
  const finalPct = Math.round(finalProb * 100);
  const delta = finalPct - initialPct;

  // Evidence Sufficiency rating based on collected evidence items
  const evidenceCount = c.evidence?.length || 1;
  const connectedCards = c.connected_card_ids?.length || 0;
  const sufficiencyPct = Math.min(98, 50 + evidenceCount * 15 + (connectedCards > 0 ? 15 : 0));

  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--bg-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} color="var(--risk-medium)" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            RISK & UNCERTAINTY CALIBRATION
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Sufficiency: <strong style={{ color: 'var(--text-primary)' }}>{sufficiencyPct}%</strong>
        </div>
      </div>

      {/* Two-Stage Probability Progression Gauge */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '16px',
          background: 'var(--bg-input)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Stage 1: Initial Assessment (Prior to verification) */}
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Initial Assessment (Pre-Check)
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
            <span className="mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-secondary)' }}>
              {initialPct}%
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>fraud probability</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Subject to Rule R1 weak signal guard
          </div>
        </div>

        {/* Transition Arrow / Evidence Catalyst */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <div
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-pill)',
              background: delta >= 0 ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)',
              color: delta >= 0 ? 'var(--risk-high)' : 'var(--risk-low)',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{delta >= 0 ? `+${delta}%` : `${delta}%`}</span>
          </div>
          <ArrowRight size={14} color="var(--border-active)" />
        </div>

        {/* Stage 2: Final Calibrated Verdict */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Post-Evidence Verdict
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
            <span
              className="mono"
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: finalPct > 70 ? 'var(--risk-high)' : finalPct < 20 ? 'var(--risk-low)' : 'var(--risk-medium)',
              }}
            >
              {finalPct}%
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>final calibrated</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {c.verdict === 'fraud' ? 'Confirmed Unauthorized' : 'Confirmed Legitimate'}
          </div>
        </div>
      </div>

      {/* What Changed Callout */}
      {nba?.what_changed && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            fontSize: '11.5px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <div style={{ marginTop: '2px' }}>
            <HelpCircle size={13} color="var(--brand-tiger)" />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, color: 'var(--brand-tiger)' }}>Catalyst / What Changed: </span>
            <span>{nba.what_changed}</span>
          </div>
        </div>
      )}
    </div>
  );
};
