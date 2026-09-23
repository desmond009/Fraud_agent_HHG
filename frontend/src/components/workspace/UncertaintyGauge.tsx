import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { CaseDetail } from '../../types';
import { snappyTransition, fadeSlideUp } from '../../utils/motion';

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

  const getVerdictColor = (pct: number) => {
    if (pct >= 70) return '#f43f5e';
    if (pct <= 25) return '#10b981';
    return '#f59e0b';
  };

  return (
    <div
      style={{
        background: 'rgba(20, 20, 25, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.4)',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} color="#f59e0b" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#a1a1aa' }}>
            Risk & Uncertainty Calibration
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#71717a' }}>
          Sufficiency: <strong style={{ color: '#f4f4f5' }}>{sufficiencyPct}%</strong>
        </div>
      </div>

      {/* Two-Stage Probability Progression Gauge */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '14px',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '12px 14px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Stage 1: Initial Assessment (Prior to verification) */}
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#71717a', fontWeight: 600 }}>
            Initial Assessment
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
            <span className="mono" style={{ fontSize: '20px', fontWeight: 800, color: '#f4f4f5' }}>
              {initialPct}%
            </span>
            <span style={{ fontSize: '10px', color: '#71717a' }}>probability</span>
          </div>

          {/* Animated Bar Width for Initial */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${initialPct}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: '100%',
                background: '#f59e0b',
                borderRadius: '2px',
              }}
            />
          </div>

          <div style={{ fontSize: '10px', color: '#71717a', marginTop: '4px' }}>
            Rule R1 weak-signal guard
          </div>
        </div>

        {/* Transition Arrow / Evidence Catalyst */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={snappyTransition}
            className="mono"
            style={{
              padding: '3px 8px',
              borderRadius: '9999px',
              background: delta >= 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: delta >= 0 ? '#f43f5e' : '#10b981',
              border: `1px solid ${delta >= 0 ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              fontSize: '10.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{delta >= 0 ? `+${delta}%` : `${delta}%`}</span>
          </motion.div>
          <ArrowRight size={13} color="#52525b" />
        </div>

        {/* Stage 2: Final Calibrated Verdict */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#71717a', fontWeight: 600 }}>
            Post-Evidence Verdict
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
            <span
              className="mono"
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: getVerdictColor(finalPct),
              }}
            >
              {finalPct}%
            </span>
            <span style={{ fontSize: '10px', color: '#71717a' }}>calibrated</span>
          </div>

          {/* Animated Bar Width for Final Verdict */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${finalPct}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: '100%',
                background: getVerdictColor(finalPct),
                borderRadius: '2px',
                boxShadow: `0 0 8px ${getVerdictColor(finalPct)}88`,
              }}
            />
          </div>

          <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '4px', fontWeight: 500 }}>
            {c.verdict === 'fraud' ? 'Confirmed Unauthorized' : 'Confirmed Legitimate'}
          </div>
        </div>
      </div>

      {/* What Changed Callout with Fluid Slide-in Entrance */}
      {nba?.what_changed && (
        <motion.div
          variants={fadeSlideUp}
          initial="initial"
          animate="animate"
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontSize: '11px',
            color: '#f4f4f5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <div style={{ marginTop: '2px', flexShrink: 0 }}>
            <HelpCircle size={13} color="#38bdf8" />
          </div>
          <div style={{ flex: 1, lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: '#38bdf8' }}>Catalyst / What Changed: </span>
            <span style={{ color: '#d4d4d8' }}>{nba.what_changed}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

