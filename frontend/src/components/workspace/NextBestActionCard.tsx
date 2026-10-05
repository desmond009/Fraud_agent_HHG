import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  FileText,
  Lock,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { CaseDetail } from '../../types';

interface NextBestActionCardProps {
  caseData: CaseDetail;
  analystRole: 'L1' | 'L2';
  onApproveAction: (actionName: string, route: string, decision: 'approve' | 'reject') => void;
  onOpenSAR?: () => void;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  caseData,
  analystRole,
  onApproveAction,
  onOpenSAR,
}) => {
  const c = caseData.case;
  const nba = caseData.next_best_actions;
  const initialActions = nba?.initial || [];
  const finalActions = nba?.final || [];
  const whatChanged = nba?.what_changed || '';

  // Dual state tab: default to 'after'
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('after');

  const currentActions = activeTab === 'before' ? initialActions : finalActions;
  const primaryAction = currentActions[0] || {
    action: c.verdict === 'legitimate' ? 'CLOSE_NO_FRAUD' : 'BLOCK_CARD',
    route: 'auto',
    reason: c.verdict === 'legitimate' ? 'Customer confirmed card presence. Close case with no adverse action.' : 'High velocity and device anomaly require immediate remediation.',
  };

  const approval = caseData.approval;
  const isExecuted = approval?.status === 'approved' || primaryAction.route === 'auto';

  // Check required clearance vs current analyst role
  const requiresL2 = finalActions.some((a) => a.route === 'L2');
  const hasClearance = requiresL2 ? analystRole === 'L2' : true;

  // Calculate high-contrast before/after probability
  const finalPct = Math.round((c.fraud_probability || 0) * 100);
  const triggerRisk = caseData.trigger?.risk_score ?? 0.55;
  const initialPct = c.verdict === 'fraud'
    ? Math.max(40, Math.min(70, finalPct - 24))
    : Math.max(25, Math.min(60, Math.round(triggerRisk * 70)));
  const delta = finalPct - initialPct;

  const isConfirmedFraud = c.verdict === 'fraud';
  const isCleared = c.verdict === 'legitimate';

  const getRouteBadge = (route: string) => {
    if (route === 'L2') {
      return (
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '9999px',
            background: 'rgba(124, 92, 214, 0.15)',
            color: '#7c5cd6',
            border: '1px solid rgba(124, 92, 214, 0.35)',
            letterSpacing: '0.03em',
          }}
        >
          ROUTE L2 (FRAUD MGR)
        </span>
      );
    }
    if (route === 'L1') {
      return (
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '9999px',
            background: 'rgba(217, 130, 11, 0.15)',
            color: '#d9820b',
            border: '1px solid rgba(217, 130, 11, 0.35)',
            letterSpacing: '0.03em',
          }}
        >
          ROUTE L1 (LEAD)
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: '9.5px',
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: '9999px',
          background: 'rgba(79, 99, 210, 0.15)',
          color: '#4f63d2',
          border: '1px solid rgba(79, 99, 210, 0.35)',
          letterSpacing: '0.03em',
        }}
      >
        ROUTE AUTO
      </span>
    );
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(71, 85, 140, 0.117)',
        boxShadow: primaryAction.action.includes('BLOCK')
          ? 'none'
          : 'none',
        borderRadius: '6px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderLeft: primaryAction.action.includes('BLOCK') ? '4px solid #dc3c45' : '4px solid #059669',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#4f63d2" />
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1f2638', fontWeight: 700 }}>
            Next-Best Action Engine
          </span>
        </div>
        {getRouteBadge(primaryAction.route)}
      </div>

      {/* Metric Transition Card (Risk Pre-Evidence vs Post-Evidence) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '6px',
          background: '#f6f7fa',
          border: '1px solid rgba(71, 85, 140, 0.078)',
          boxShadow: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#6b7388', fontWeight: 600 }}>Initial</div>
            <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: '#556078' }}>{initialPct}%</div>
          </div>

          <ArrowRight size={13} color="#6b7388" />

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#6b7388', fontWeight: 600 }}>Post-Evidence</div>
            <div
              className="mono"
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: isConfirmedFraud ? '#dc3c45' : '#059669',
                textShadow: isConfirmedFraud ? '0 0 12px rgba(220, 60, 69, 0.4)' : '0 0 12px rgba(5, 150, 105, 0.4)',
              }}
            >
              {finalPct}%
            </div>
          </div>
        </div>

        {/* Delta Pill */}
        <div
          className="mono"
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '9999px',
            background: delta > 0 ? 'rgba(220, 60, 69, 0.15)' : 'rgba(5, 150, 105, 0.15)',
            color: delta > 0 ? '#dc3c45' : '#059669',
            border: `1px solid ${delta > 0 ? 'rgba(220, 60, 69, 0.35)' : 'rgba(5, 150, 105, 0.35)'}`,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{delta > 0 ? `+${delta}% (Surge)` : `${delta}% (Cleared)`}</span>
        </div>
      </div>

      {/* Dual State Switcher Tabs with layoutId */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          background: '#f6f7fa',
          border: '1px solid rgba(71, 85, 140, 0.078)',
          borderRadius: '6px',
          padding: '2px',
        }}
      >
        <button
          onClick={() => setActiveTab('before')}
          style={{
            position: 'relative',
            flex: 1,
            padding: '5px 0',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: activeTab === 'before' ? '#1f2638' : '#6b7388',
            zIndex: 2,
            transition: 'color 0.15s ease',
          }}
        >
          {activeTab === 'before' && (
            <motion.div
              layoutId="actionTabIndicator"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '4px',
                background: 'rgba(71, 85, 140, 0.13)',
                border: '1px solid rgba(71, 85, 140, 0.156)',
                zIndex: -1,
              }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          1. Before Evidence ({initialPct}%)
        </button>
        <button
          onClick={() => setActiveTab('after')}
          style={{
            position: 'relative',
            flex: 1,
            padding: '5px 0',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: activeTab === 'after' ? '#4f63d2' : '#6b7388',
            zIndex: 2,
            transition: 'color 0.15s ease',
          }}
        >
          {activeTab === 'after' && (
            <motion.div
              layoutId="actionTabIndicator"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '4px',
                background: 'rgba(71, 85, 140, 0.13)',
                border: '1px solid rgba(79, 99, 210, 0.35)',
                zIndex: -1,
              }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          2. After Evidence ({finalPct}%)
        </button>
      </div>

      {/* Prominent Recommendation Card */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: '6px',
          background: activeTab === 'before'
            ? 'rgba(217, 130, 11, 0.08)'
            : isConfirmedFraud
            ? 'rgba(220, 60, 69, 0.08)'
            : 'rgba(5, 150, 105, 0.08)',
          border: activeTab === 'before'
            ? '1px solid rgba(217, 130, 11, 0.25)'
            : isConfirmedFraud
            ? '1px solid rgba(220, 60, 69, 0.3)'
            : '1px solid rgba(5, 150, 105, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            className="mono"
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: primaryAction.action.includes('BLOCK')
                ? '#dc3c45'
                : primaryAction.action.includes('CLOSE') || primaryAction.action.includes('APPROVE')
                ? '#059669'
                : '#1f2638',
              letterSpacing: '-0.02em',
              textShadow: primaryAction.action.includes('BLOCK') ? '0 0 16px rgba(220, 60, 69, 0.35)' : 'none',
            }}
          >
            {primaryAction.action}
          </span>
          <span
            className="mono"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: activeTab === 'before' ? '#d9820b' : isConfirmedFraud ? '#dc3c45' : '#059669',
              background: 'rgba(71, 85, 140, 0.052)',
              padding: '2px 7px',
              borderRadius: '9999px',
              border: '1px solid rgba(71, 85, 140, 0.091)',
            }}
          >
            Confidence: {activeTab === 'before' ? `${initialPct}%` : `${finalPct}%`}
          </span>
        </div>

        <p style={{ fontSize: '11.5px', color: '#556078', lineHeight: 1.45, margin: 0 }}>
          {primaryAction.reason}
        </p>

        {/* Explainability Delta */}
        {activeTab === 'after' && whatChanged && (
          <div
            style={{
              marginTop: '4px',
              padding: '7px 9px',
              borderRadius: '6px',
              background: '#f6f7fa',
              border: '1px solid rgba(71, 85, 140, 0.078)',
              fontSize: '10.5px',
              color: '#556078',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <TrendingUp size={13} color="#4f63d2" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#4f63d2' }}>Agent Evidence Shift: </strong>
              <span>{whatChanged}</span>
            </div>
          </div>
        )}
      </div>

      {/* Operational Steps List */}
      {currentActions.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7388', fontWeight: 700 }}>
            Operational Protocol ({currentActions.length} actions)
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {currentActions.map((act, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(71, 85, 140, 0.052)',
                  border: '1px solid rgba(71, 85, 140, 0.078)',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span style={{ color: '#6b7388' }}>{i + 1}.</span>
                <span style={{ fontWeight: 600, color: act.action.includes('BLOCK') ? '#dc3c45' : '#1f2638' }}>
                  {act.action}
                </span>
                <span style={{ fontSize: '9px', color: '#6b7388' }}>({act.route})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Approval Sign-Off Bar */}
      <div style={{ borderTop: '1px solid rgba(71, 85, 140, 0.078)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7388', fontWeight: 700 }}>
            Analyst Action Sign-Off
          </span>
          {isExecuted && (
            <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={11} /> {approval?.approved_by ? `APPROVED BY ${approval.approved_by}` : 'EXECUTED'}
            </span>
          )}
        </div>

        {/* Action Buttons Grid with Smooth Hover & Press Motion */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {(() => {
            const isBlockActive = approval?.status === 'approved' && approval?.action_name === 'BLOCK_CARD';
            const isApproveActive = approval?.status === 'approved' && approval?.action_name === 'APPROVE_TRANSACTION';

            return (
              <>
                <motion.button
                  whileHover={hasClearance ? { y: -1 } : {}}
                  whileTap={hasClearance ? { scale: 0.98 } : {}}
                  onClick={() => onApproveAction('BLOCK_CARD', primaryAction.route, 'approve')}
                  disabled={!hasClearance}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '6px',
                    background: isBlockActive
                      ? 'linear-gradient(180deg, rgba(220, 60, 69, 0.4), rgba(220, 60, 69, 0.22))'
                      : 'linear-gradient(180deg, rgba(220, 60, 69, 0.22), rgba(220, 60, 69, 0.12))',
                    border: isBlockActive
                      ? '2px solid #dc3c45'
                      : '1px solid rgba(220, 60, 69, 0.45)',
                    boxShadow: isBlockActive
                      ? 'none'
                      : 'none',
                    color: '#dc3c45',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: hasClearance ? 'pointer' : 'not-allowed',
                    opacity: hasClearance ? 1 : 0.4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Lock size={12} />
                  <span>{isBlockActive ? 'Blocked ✓' : 'Block Card'}</span>
                </motion.button>

                <motion.button
                  whileHover={hasClearance ? { y: -1 } : {}}
                  whileTap={hasClearance ? { scale: 0.98 } : {}}
                  onClick={() => onApproveAction('APPROVE_TRANSACTION', primaryAction.route, 'approve')}
                  disabled={!hasClearance}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '6px',
                    background: isApproveActive
                      ? 'linear-gradient(180deg, rgba(5, 150, 105, 0.4), rgba(5, 150, 105, 0.22))'
                      : 'linear-gradient(180deg, rgba(5, 150, 105, 0.22), rgba(5, 150, 105, 0.12))',
                    border: isApproveActive
                      ? '2px solid #059669'
                      : '1px solid rgba(5, 150, 105, 0.45)',
                    boxShadow: isApproveActive
                      ? 'none'
                      : 'none',
                    color: '#059669',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: hasClearance ? 'pointer' : 'not-allowed',
                    opacity: hasClearance ? 1 : 0.4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Check size={12} />
                  <span>{isApproveActive ? 'Approved ✓' : 'Clear & Approve'}</span>
                </motion.button>
              </>
            );
          })()}
        </div>

        {/* Secondary SAR trigger */}
        {caseData.sar?.file && onOpenSAR && (
          <motion.button
            whileHover={{ backgroundColor: 'rgba(79, 99, 210, 0.08)' }}
            whileTap={{}}
            onClick={onOpenSAR}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              background: 'rgba(71, 85, 140, 0.039)',
              border: '1px solid rgba(79, 99, 210, 0.25)',
              color: '#4f63d2',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={12} />
            <span>Open FinCEN SAR Report Preview</span>
          </motion.button>
        )}
      </div>
    </div>
  );

};
