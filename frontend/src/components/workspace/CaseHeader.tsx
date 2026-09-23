import React from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { CaseDetail } from '../../types';
import { AnimatedCounter } from '../../utils/motion';

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
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          {/* Animated Radar Pulse Ring */}
          <motion.span
            animate={{ scale: [1, 2.3], opacity: [0.75, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: '9999px',
              border: '2px solid rgba(244, 63, 94, 0.8)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 11px',
              borderRadius: '9999px',
              background: 'rgba(244, 63, 94, 0.18)',
              color: '#f43f5e',
              border: '1px solid rgba(244, 63, 94, 0.45)',
              boxShadow: '0 0 14px rgba(244, 63, 94, 0.25)',
              letterSpacing: '0.03em',
            }}
          >
            <ShieldAlert size={12} /> CONFIRMED FRAUD
          </span>
        </div>
      );
    }
    if (verdict === 'legitimate') {
      return (
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 11px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.18)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.2)',
              letterSpacing: '0.03em',
            }}
          >
            <ShieldCheck size={12} /> CLEARED LEGITIMATE
          </span>
        </div>
      );
    }
    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <motion.span
          animate={{ scale: [1, 2.1], opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: '9999px',
            border: '2px solid rgba(245, 158, 11, 0.7)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 11px',
            borderRadius: '9999px',
            background: 'rgba(245, 158, 11, 0.18)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            letterSpacing: '0.03em',
          }}
        >
          <HelpCircle size={12} /> UNCERTAIN / REVIEW
        </span>
      </div>
    );
  };

  const formatPattern = (pattern: string) => {
    if (!pattern || pattern === 'none') return 'Routine Transaction';
    return pattern
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const isHighRisk = probPercent >= 70;
  const isLowRisk = probPercent <= 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'radial-gradient(ellipse at 15% 0%, rgba(14, 165, 233, 0.08), transparent 70%), rgba(20, 20, 26, 0.78)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 4px 20px rgba(0, 0, 0, 0.45)',
        borderRadius: '10px',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Subtle Top Accent Beam */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '5%',
          right: '5%',
          height: '1px',
          background: isHighRisk
            ? 'linear-gradient(90deg, transparent, rgba(244, 63, 94, 0.5), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent)',
        }}
      />

      {/* Top Row: Case ID, Status Pill, Risk Pill, Financial Exposure & SAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Left Side: Large Case ID & Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1
            className="mono"
            style={{
              fontSize: '23px',
              fontWeight: 800,
              color: '#f4f4f5',
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {caseData.case_id}
          </h1>

          {getVerdictBadge()}

          <span
            className="mono"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '9999px',
              background: isHighRisk ? 'rgba(244, 63, 94, 0.15)' : isLowRisk ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isHighRisk ? '#f43f5e' : isLowRisk ? '#10b981' : '#f59e0b',
              border: `1px solid ${isHighRisk ? 'rgba(244, 63, 94, 0.35)' : isLowRisk ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 'normal',
            }}
          >
            {probPercent}% RISK
          </span>

          <span
            style={{
              fontSize: '10.5px',
              padding: '3px 9px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#a1a1aa',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.03em',
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 'normal',
            }}
          >
            {c.status || 'Active'}
          </span>
        </div>

        {/* Right Side: Exposure Callout & FinCEN SAR Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', fontWeight: 700 }}>
              Total Exposure
            </div>
            <div
              className="mono"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: exposure > 0 ? '#f43f5e' : '#f4f4f5',
                letterSpacing: '-0.02em',
                textShadow: exposure > 0 ? '0 0 16px rgba(244, 63, 94, 0.3)' : 'none',
              }}
            >
              <AnimatedCounter value={exposure} prefix="$" suffix=" USD" decimals={2} duration={0.8} />
            </div>
          </div>

          {caseData.sar?.file && onOpenSAR && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenSAR}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.18), rgba(14, 165, 233, 0.08))',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                boxShadow: '0 0 12px rgba(14, 165, 233, 0.18)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              <FileText size={13} />
              <span>FinCEN SAR Ready</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Inline Secondary Metadata Row (Latency, Graph Write, Customer, Card, Typology) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '11px',
          color: '#a1a1aa',
        }}
      >
        {/* Core Entities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} color="#71717a" />
            <span style={{ color: '#71717a' }}>Customer:</span>
            <span className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>{trigger?.customer_id}</span>
          </div>

          <span style={{ color: '#3f3f46' }}>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CreditCard size={12} color="#71717a" />
            <span style={{ color: '#71717a' }}>Card:</span>
            <span className="mono" style={{ color: '#f4f4f5', fontWeight: 600 }}>{trigger?.card_id}</span>
          </div>

          <span style={{ color: '#3f3f46' }}>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#71717a' }}>Typology:</span>
            <span style={{ color: '#f4f4f5', fontWeight: 600 }}>{formatPattern(c.pattern)}</span>
          </div>
        </div>

        {/* Telemetry Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} color="#71717a" />
            <span style={{ color: '#71717a' }}>Latency:</span>
            <span className="mono" style={{ color: '#f4f4f5', fontWeight: 600 }}>{caseData.latency_s}s</span>
          </div>

          <span style={{ color: '#3f3f46' }}>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={11} color="#71717a" />
            <span style={{ color: '#71717a' }}>Tools:</span>
            <span className="mono" style={{ color: '#f4f4f5', fontWeight: 600 }}>{caseData.tool_calls}</span>
          </div>

          <span style={{ color: '#3f3f46' }}>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Database size={11} color="#10b981" />
            <span style={{ color: '#71717a' }}>TigerGraph:</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 600 }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              Synced
            </span>
          </div>
        </div>
      </div>

      {/* Trigger Reason Banner Strip */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '6px',
          padding: '7px 11px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.4)',
        }}
      >
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: 'rgba(14, 165, 233, 0.16)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '2px 7px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          TRIGGER: {trigger?.trigger_type.replace('_', ' ')}
        </span>
        <span style={{ color: '#d4d4d8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {trigger?.trigger_text || 'Automated risk scoring on authorization request.'}
        </span>
      </div>
    </motion.div>
  );
};

