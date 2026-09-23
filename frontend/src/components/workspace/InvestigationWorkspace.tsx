import React, { useState } from 'react';
import {
  CaseDetail,
  SubgraphData,
} from '../../types';
import { CaseHeader } from './CaseHeader';
import { GraphExplorer } from './GraphExplorer';
import { AgentActivityFeed } from './AgentActivityFeed';
import { UncertaintyGauge } from './UncertaintyGauge';
import { EvidencePanel } from './EvidencePanel';
import { NextBestActionCard } from './NextBestActionCard';
import { CaseMemoryCard } from './CaseMemoryCard';
import { SARDrawer } from './SARDrawer';
import { InvestigationTimeline } from './InvestigationTimeline';
import {
  CreditCard,
  User,
  Receipt,
  Smartphone,
  Shield,
  Layers,
  FileText,
} from 'lucide-react';

interface InvestigationWorkspaceProps {
  caseData: CaseDetail | null;
  subgraph: SubgraphData | null;
  loading?: boolean;
  analystRole: 'L1' | 'L2';
  onApproveAction: (actionName: string, route: string, decision: 'approve' | 'reject') => void;
  isRunning?: boolean;
}

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  caseData,
  subgraph,
  loading,
  analystRole,
  onApproveAction,
  isRunning,
}) => {
  const [sarOpen, setSarOpen] = useState(false);

  if (loading || !caseData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton" style={{ height: '90px', width: '100%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr 340px', gap: '16px', height: '520px' }}>
          <div className="skeleton" style={{ height: '100%' }} />
          <div className="skeleton" style={{ height: '100%' }} />
          <div className="skeleton" style={{ height: '100%' }} />
        </div>
      </div>
    );
  }

  const trigger = caseData.trigger;
  const c = caseData.case;

  return (
    <div className="workspace-container">
      {/* 1. Case Header */}
      <CaseHeader caseData={caseData} />

      {/* 2. Three-Column Investigation Layout */}
      <div className="workspace-grid">
        {/* Left Column: Entity Context, Uncertainty Gauge, Case Memory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          {/* Entity Profile Card */}
          <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              CORE ENTITY CONTEXT
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} color="var(--brand-tiger)" />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Customer ID</span>
                </div>
                <span className="mono" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {trigger?.customer_id}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={13} color="var(--brand-tiger)" />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Card ID</span>
                </div>
                <span className="mono" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {trigger?.card_id}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={13} color="var(--brand-tiger)" />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Flagged Txn</span>
                </div>
                <span className="mono" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--risk-high)' }}>
                  #{trigger?.flagged_txn_id}
                </span>
              </div>

              {c.connected_device_profiles && c.connected_device_profiles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Smartphone size={13} color="var(--brand-tiger)" />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Device Profile</span>
                  </div>
                  <span className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--route-l2)' }}>
                    {c.connected_device_profiles[0].slice(0, 10)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Uncertainty & Probability Gauge */}
          <UncertaintyGauge caseData={caseData} />

          {/* Case Memory Card */}
          <CaseMemoryCard caseData={caseData} />
        </div>

        {/* Center Column: Interactive Graph Explorer & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0 }}>
          {/* Main Force-Directed Graph */}
          <div style={{ flex: 1, minHeight: '380px' }}>
            <GraphExplorer subgraph={subgraph} loading={loading} />
          </div>

          {/* Investigation Timeline */}
          <InvestigationTimeline caseData={caseData} />
        </div>

        {/* Right Column: Next Best Action & Agent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          {/* Next Best Action Card (Centerpiece Approval Flow) */}
          <NextBestActionCard
            caseData={caseData}
            analystRole={analystRole}
            onApproveAction={onApproveAction}
            onOpenSAR={() => setSarOpen(true)}
          />

          {/* Agent Activity Feed */}
          <AgentActivityFeed caseData={caseData} isRunning={isRunning} />

          {/* Evidence Dossier */}
          <EvidencePanel caseData={caseData} />
        </div>
      </div>

      {/* Standalone FinCEN Suspicious Activity Report (SAR) Drawer */}
      {caseData.sar && (
        <SARDrawer
          isOpen={sarOpen}
          onClose={() => setSarOpen(false)}
          caseId={caseData.case_id}
          sar={caseData.sar}
        />
      )}
    </div>
  );
};
