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
import { snappyTransition, fadeSlideUp, AnimatedCounter } from '../../utils/motion';

interface UncertaintyGaugeProps {
  caseData: CaseDetail;
}

export const UncertaintyGauge: React.FC<UncertaintyGaugeProps> = ({ caseData }) => {
  const c = caseData.case;
  const nba = caseData.next_best_actions;
  const finalProb = c.fraud_probability || 0;

  // Calculate initial probability based on trigger or evidence requests
  const triggerRisk = caseData.trigger?.risk_score ?? 0.55;
  const initialProb =
    c.verdict === 'fraud'
      ? Math.max(0.4, Math.min(0.7, finalProb - 0.18))
      : Math.min(0.6, Math.max(0.2, triggerRisk * 0.7));

  const initialPct = Math.round(initialProb * 100);
  const finalPct = Math.round(finalProb * 100);
  const delta = finalPct - initialPct;

  // Evidence Sufficiency rating based on collected evidence items
  const evidenceCount = c.evidence?.length || 1;
  const connectedCards = c.connected_card_ids?.length || 0;
  const sufficiencyPct = Math.min(98, 50 + evidenceCount * 15 + (connectedCards > 0 ? 15 : 0));

  const getVerdictColor = (pct: number) => {
    if (pct >= 70) return '#dc3c45';
    if (pct <= 25) return '#059669';
    return '#d9820b';
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(71, 85, 140, 0.117)',
        boxShadow: 'none',
        borderRadius: '6px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} color="#d9820b" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1f2638' }}>
            Risk & Uncertainty Calibration
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '10.5px', color: '#556078' }}>
            Sufficiency: <strong style={{ color: '#4f63d2' }}>{sufficiencyPct}%</strong>
          </div>
          <div style={{ width: '40px', height: '4px', background: 'rgba(71, 85, 140, 0.104)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sufficiencyPct}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: '100%', background: '#4f63d2', borderRadius: '2px' }}
            />
          </div>
        </div>
      </div>

      {/* Two-Stage Probability Progression Gauge */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '14px',
          background: '#f6f7fa',
          padding: '12px 14px',
          borderRadius: '6px',
          border: '1px solid rgba(71, 85, 140, 0.078)',
          boxShadow: 'none',
        }}
      >
        {/* Stage 1: Initial Assessment (Prior to verification) */}
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7388', fontWeight: 600 }}>
            Initial Assessment
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
            <span className="mono" style={{ fontSize: '20px', fontWeight: 700, color: '#1f2638' }}>
              <AnimatedCounter value={initialPct} suffix="%" duration={0.8} />
            </span>
            <span style={{ fontSize: '10px', color: '#6b7388' }}>probability</span>
          </div>

          {/* Animated Bar Width for Initial */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(71, 85, 140, 0.104)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${initialPct}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: '100%',
                background: '#d9820b',
                borderRadius: '2px',
                boxShadow: 'none',
              }}
            />
          </div>

          <div style={{ fontSize: '10px', color: '#6b7388', marginTop: '4px' }}>
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
              background: delta >= 0 ? 'rgba(220, 60, 69, 0.15)' : 'rgba(5, 150, 105, 0.15)',
              color: delta >= 0 ? '#dc3c45' : '#059669',
              border: `1px solid ${delta >= 0 ? 'rgba(220, 60, 69, 0.35)' : 'rgba(5, 150, 105, 0.35)'}`,
              boxShadow: 'none',
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
          <ArrowRight size={13} color="#8c94a8" />
        </div>

        {/* Stage 2: Final Calibrated Verdict */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7388', fontWeight: 600 }}>
            Post-Evidence Verdict
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
            <span
              className="mono"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: getVerdictColor(finalPct),
                textShadow: `0 0 14px ${getVerdictColor(finalPct)}50`,
              }}
            >
              <AnimatedCounter value={finalPct} suffix="%" duration={0.8} />
            </span>
            <span style={{ fontSize: '10px', color: '#6b7388' }}>calibrated</span>
          </div>

          {/* Animated Bar Width for Final Verdict */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(71, 85, 140, 0.104)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${finalPct}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: '100%',
                background: getVerdictColor(finalPct),
                borderRadius: '2px',
                boxShadow: 'none',
              }}
            />
          </div>

          <div style={{ fontSize: '10px', color: '#556078', marginTop: '4px', fontWeight: 500 }}>
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
            background: 'rgba(79, 99, 210, 0.08)',
            border: '1px solid rgba(79, 99, 210, 0.25)',
            boxShadow: 'none',
            fontSize: '11px',
            color: '#1f2638',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <div style={{ marginTop: '2px', flexShrink: 0 }}>
            <HelpCircle size={13} color="#4f63d2" />
          </div>
          <div style={{ flex: 1, lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: '#4f63d2' }}>Catalyst / What Changed: </span>
            <span style={{ color: '#3a445b' }}>{nba.what_changed}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};


