import React, { useState } from 'react';
import {
  Check,
  FileText,
  Lock,
  TrendingUp,
  Sparkles,
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
  const nba = caseData.next_best_actions;
  const initialActions = nba?.initial || [];
  const finalActions = nba?.final || [];
  const whatChanged = nba?.what_changed || '';

  // Dual state tab: default to 'after' if final exists, but allow toggling
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('after');

  const currentActions = activeTab === 'before' ? initialActions : finalActions;
  const primaryAction = currentActions[0] || {
    action: 'MONITOR_CARD',
    route: 'auto',
    reason: 'Routine monitoring active',
  };

  const approval = caseData.approval;
  const isExecuted = approval?.status === 'approved' || primaryAction.route === 'auto';

  // Check required clearance vs current analyst role
  const requiresL2 = finalActions.some((a) => a.route === 'L2');
  const hasClearance = requiresL2 ? analystRole === 'L2' : true;

  const initialConf = Math.max(35, Math.round(((caseData.case.fraud_probability || 0) - 0.28) * 100));
  const finalConf = Math.round((caseData.case.fraud_probability || 0) * 100);

  const getRouteBadge = (route: string) => {
    if (route === 'L2') {
      return (
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--route-l2-bg)',
            color: 'var(--route-l2)',
            border: '1px solid var(--route-l2-border)',
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
            padding: '2px 6px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--route-l1-bg)',
            color: 'var(--route-l1)',
            border: '1px solid var(--route-l1-border)',
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
          padding: '2px 6px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--route-auto-bg)',
          color: 'var(--route-auto)',
          border: '1px solid var(--route-auto-border)',
        }}
      >
        ROUTE AUTO
      </span>
    );
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderLeft: primaryAction.action.includes('BLOCK') ? '4px solid var(--risk-high)' : '4px solid var(--brand-tiger)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="var(--brand-tiger)" />
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Next-Best Action Engine
          </span>
        </div>
        {getRouteBadge(primaryAction.route)}
      </div>

      {/* Dual State Switcher Tabs: Before vs After Additional Evidence */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px',
        }}
      >
        <button
          onClick={() => setActiveTab('before')}
          style={{
            flex: 1,
            padding: '5px 0',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'before' ? 'var(--bg-card-elevated)' : 'transparent',
            color: activeTab === 'before' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeTab === 'before' ? 'var(--shadow-subtle)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          1. Before Evidence ({initialConf}%)
        </button>
        <button
          onClick={() => setActiveTab('after')}
          style={{
            flex: 1,
            padding: '5px 0',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'after' ? 'var(--bg-card-elevated)' : 'transparent',
            color: activeTab === 'after' ? 'var(--brand-tiger-hover)' : 'var(--text-muted)',
            boxShadow: activeTab === 'after' ? 'var(--shadow-subtle)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          2. After Evidence ({finalConf}%)
        </button>
      </div>

      {/* Primary Action Box */}
      <div
        style={{
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          background: activeTab === 'before' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(244, 63, 94, 0.08)',
          border: activeTab === 'before' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            className="mono"
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: primaryAction.action.includes('BLOCK') ? 'var(--risk-high)' : 'var(--text-primary)',
            }}
          >
            {primaryAction.action}
          </span>
          <span
            className="mono"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: activeTab === 'before' ? 'var(--risk-medium)' : 'var(--risk-high)',
            }}
          >
            Confidence: {activeTab === 'before' ? `${initialConf}%` : `${finalConf}%`}
          </span>
        </div>

        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          {primaryAction.reason}
        </p>

        {/* Explainability Delta */}
        {activeTab === 'after' && whatChanged && (
          <div
            style={{
              marginTop: '4px',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              fontSize: '10.5px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <TrendingUp size={13} color="var(--brand-tiger-hover)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Agent Evidence Shift: </strong>
              <span>{whatChanged}</span>
            </div>
          </div>
        )}
      </div>

      {/* Complete Action Steps */}
      {currentActions.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            Operational Steps ({currentActions.length})
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {currentActions.map((act, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 7px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tag)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{i + 1}.</span>
                <span style={{ fontWeight: 600, color: act.action.includes('BLOCK') ? 'var(--risk-high)' : 'var(--text-primary)' }}>
                  {act.action}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>({act.route})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Approval Sign-Off Bar */}
      <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Analyst Action Sign-Off
          </span>
          {isExecuted && (
            <span style={{ fontSize: '10px', color: 'var(--risk-low)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={11} /> {approval?.approved_by ? `APPROVED BY ${approval.approved_by}` : 'EXECUTED'}
            </span>
          )}
        </div>

        {/* Action Buttons Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button
            onClick={() => onApproveAction('BLOCK_CARD', primaryAction.route, 'approve')}
            disabled={!hasClearance}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: 'var(--risk-high)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: hasClearance ? 'pointer' : 'not-allowed',
              opacity: hasClearance ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Lock size={12} />
            <span>Block Card</span>
          </button>

          <button
            onClick={() => onApproveAction('APPROVE_TRANSACTION', primaryAction.route, 'approve')}
            disabled={!hasClearance}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: 'var(--risk-low)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: hasClearance ? 'pointer' : 'not-allowed',
              opacity: hasClearance ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Check size={12} />
            <span>Clear / Approve</span>
          </button>
        </div>

        {/* Secondary SAR trigger */}
        {caseData.sar?.file && onOpenSAR && (
          <button
            onClick={onOpenSAR}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--brand-tiger-hover)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <FileText size={12} />
            <span>Open FinCEN SAR Report Preview</span>
          </button>
        )}
      </div>
    </div>
  );
};
