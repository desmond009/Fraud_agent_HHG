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
              border: '2px solid rgba(220, 60, 69, 0.8)',
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
              background: 'rgba(220, 60, 69, 0.18)',
              color: '#dc3c45',
              border: '1px solid rgba(220, 60, 69, 0.45)',
              boxShadow: 'none',
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
              background: 'rgba(5, 150, 105, 0.18)',
              color: '#059669',
              border: '1px solid rgba(5, 150, 105, 0.45)',
              boxShadow: 'none',
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
            border: '2px solid rgba(217, 130, 11, 0.7)',
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
            background: 'rgba(217, 130, 11, 0.18)',
            color: '#d9820b',
            border: '1px solid rgba(217, 130, 11, 0.45)',
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
        background: '#ffffff',
        border: '1px solid rgba(71, 85, 140, 0.117)',
        boxShadow: 'none',
        borderRadius: '6px',
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
            ? 'linear-gradient(90deg, transparent, rgba(220, 60, 69, 0.5), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(79, 99, 210, 0.5), transparent)',
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
              fontWeight: 700,
              color: '#1f2638',
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
              background: isHighRisk ? 'rgba(220, 60, 69, 0.15)' : isLowRisk ? 'rgba(5, 150, 105, 0.15)' : 'rgba(217, 130, 11, 0.15)',
              color: isHighRisk ? '#dc3c45' : isLowRisk ? '#059669' : '#d9820b',
              border: `1px solid ${isHighRisk ? 'rgba(220, 60, 69, 0.35)' : isLowRisk ? 'rgba(5, 150, 105, 0.35)' : 'rgba(217, 130, 11, 0.35)'}`,
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
              background: 'rgba(71, 85, 140, 0.065)',
              border: '1px solid rgba(71, 85, 140, 0.104)',
              color: '#556078',
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
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7388', fontWeight: 700 }}>
              Total Exposure
            </div>
            <div
              className="mono"
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: exposure > 0 ? '#dc3c45' : '#1f2638',
                letterSpacing: '-0.02em',
                textShadow: exposure > 0 ? '0 0 16px rgba(220, 60, 69, 0.3)' : 'none',
              }}
            >
              <AnimatedCounter value={exposure} prefix="$" suffix=" USD" decimals={2} duration={0.8} />
            </div>
          </div>

          {caseData.sar?.file && onOpenSAR && (
            <motion.button
              whileHover={{}}
              whileTap={{}}
              onClick={onOpenSAR}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'linear-gradient(180deg, rgba(79, 99, 210, 0.18), rgba(79, 99, 210, 0.08))',
                border: '1px solid rgba(79, 99, 210, 0.45)',
                boxShadow: 'none',
                color: '#4f63d2',
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
          borderTop: '1px solid rgba(71, 85, 140, 0.078)',
          fontSize: '11px',
          color: '#556078',
        }}
      >
        {/* Core Entities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} color="#6b7388" />
            <span style={{ color: '#6b7388' }}>Customer:</span>
            <span className="mono" style={{ color: '#4f63d2', fontWeight: 600 }}>{trigger?.customer_id}</span>
          </div>

          <span style={{ color: '#b4bccd' }}>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CreditCard size={12} color="#6b7388" />
            <span style={{ color: '#6b7388' }}>Card:</span>
            <span className="mono" style={{ color: '#1f2638', fontWeight: 600 }}>{trigger?.card_id}</span>
          </div>

          <span style={{ color: '#b4bccd' }}>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#6b7388' }}>Typology:</span>
            <span style={{ color: '#1f2638', fontWeight: 600 }}>{formatPattern(c.pattern)}</span>
          </div>
        </div>

        {/* Telemetry Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} color="#6b7388" />
            <span style={{ color: '#6b7388' }}>Latency:</span>
            <span className="mono" style={{ color: '#1f2638', fontWeight: 600 }}>{caseData.latency_s}s</span>
          </div>

          <span style={{ color: '#b4bccd' }}>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={11} color="#6b7388" />
            <span style={{ color: '#6b7388' }}>Tools:</span>
            <span className="mono" style={{ color: '#1f2638', fontWeight: 600 }}>{caseData.tool_calls}</span>
          </div>

          <span style={{ color: '#b4bccd' }}>•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Database size={11} color="#059669" />
            <span style={{ color: '#6b7388' }}>TigerGraph:</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#059669',
                  boxShadow: 'none',
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
          background: '#f6f7fa',
          border: '1px solid rgba(71, 85, 140, 0.078)',
          borderRadius: '6px',
          padding: '7px 11px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          boxShadow: 'none',
        }}
      >
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: 'rgba(79, 99, 210, 0.16)',
            color: '#4f63d2',
            border: '1px solid rgba(79, 99, 210, 0.3)',
            padding: '2px 7px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          TRIGGER: {trigger?.trigger_type.replace('_', ' ')}
        </span>
        <span style={{ color: '#3a445b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {trigger?.trigger_text || 'Automated risk scoring on authorization request.'}
        </span>
      </div>
    </motion.div>
  );
};

