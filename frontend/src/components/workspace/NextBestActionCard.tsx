import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  AlertOctagon,
  FileText,
  UserCheck,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CaseDetail, ActionItem } from '../../types';

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
  const finalActions = nba?.final || [];
  const primaryAction = finalActions[0] || { action: 'MONITOR_CARD', route: 'auto', reason: 'Routine monitoring' };
  const approval = caseData.approval;

  const [notes, setNotes] = useState('');

  // Check required clearance vs current analyst role
  const requiresL2 = finalActions.some((a) => a.route === 'L2');
  const hasClearance = requiresL2 ? analystRole === 'L2' : true;

  const getActionBadge = (route: string) => {
    if (route === 'L2') return <span className="badge badge-l2 badge-pill">ROUTE L2 (FRAUD MGR)</span>;
    if (route === 'L1') return <span className="badge badge-l1 badge-pill">ROUTE L1 (TEAM LEAD)</span>;
    return <span className="badge badge-auto badge-pill">ROUTE AUTO (AGENT)</span>;
  };

  const isExecuted = approval?.status === 'approved' || primaryAction.route === 'auto';
  const isRejected = approval?.status === 'rejected';

  return (
    <div
      className="card card-elevated"
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: 'var(--bg-card-elevated)',
        border: '1px solid var(--border-default)',
        borderLeft: primaryAction.action.includes('BLOCK') ? '4px solid var(--risk-high)' : '4px solid var(--brand-tiger)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700 }}>
            RECOMMENDED NEXT BEST ACTION
          </span>
          {getActionBadge(primaryAction.route)}
        </div>

        {caseData.sar?.file && (
          <button
            onClick={onOpenSAR}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', borderColor: 'var(--route-l2-border)', color: 'var(--route-l2)' }}
          >
            <FileText size={12} />
            <span>FinCEN SAR Ready (${caseData.sar.total_amount_usd.toFixed(2)})</span>
          </button>
        )}
      </div>

      {/* Main Primary Action Box */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: primaryAction.action.includes('BLOCK') ? 'var(--risk-high)' : 'var(--text-primary)' }}>
            {primaryAction.action}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {primaryAction.reason}
          </p>
        </div>

        {/* Execution / Approval Status Pill */}
        <div>
          {isExecuted && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--risk-low-bg)',
                border: '1px solid var(--risk-low-border)',
                color: 'var(--risk-low)',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <Check size={13} />
              <span>{approval?.approved_by ? `APPROVED BY ${approval.approved_by.toUpperCase()}` : 'AUTO-EXECUTED'}</span>
            </div>
          )}
          {isRejected && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--risk-high-bg)',
                border: '1px solid var(--risk-high-border)',
                color: 'var(--risk-high)',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <X size={13} />
              <span>REJECTED BY ANALYST</span>
            </div>
          )}
        </div>
      </div>

      {/* Complete Action Sequence */}
      {finalActions.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Full Operational Protocol ({finalActions.length} steps):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {finalActions.map((act, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tag)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
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

      {/* Human Approval Controls (Required for L1/L2) */}
      {primaryAction.route !== 'auto' && !isExecuted && !isRejected && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={16} color="var(--risk-medium)" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                HUMAN APPROVAL REQUIRED ({primaryAction.route})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {hasClearance
                  ? `Your active role (${analystRole}) has authorization to sign off on this action under Fraud Policy.`
                  : `Policy requires L2 (Fraud Manager) sign-off. Switch role in top bar to authorize.`}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onApproveAction(primaryAction.action, primaryAction.route, 'reject')}
              className="btn btn-secondary btn-sm"
              disabled={!hasClearance}
            >
              <X size={12} />
              <span>Reject</span>
            </button>
            <button
              onClick={() => onApproveAction(primaryAction.action, primaryAction.route, 'approve')}
              className="btn btn-primary btn-sm"
              disabled={!hasClearance}
              style={{ background: 'var(--risk-low)', borderColor: 'var(--risk-low-border)', color: '#fff' }}
            >
              <Check size={13} />
              <span>Approve & Execute</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
