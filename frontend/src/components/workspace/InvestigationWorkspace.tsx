import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  CaseDetail,
  CaseSummary,
  SubgraphData,
} from '../../types';
import { CaseInbox } from './CaseInbox';
import { CaseHeader } from './CaseHeader';
import { GraphExplorer } from './GraphExplorer';
import { AgentActivityFeed } from './AgentActivityFeed';
import { UncertaintyGauge } from './UncertaintyGauge';
import { EvidencePanel } from './EvidencePanel';
import { NextBestActionCard } from './NextBestActionCard';
import { CaseMemoryCard } from './CaseMemoryCard';
import { SARDrawer } from './SARDrawer';
import { InvestigationTimeline } from './InvestigationTimeline';

interface InvestigationWorkspaceProps {
  caseData: CaseDetail | null;
  subgraph: SubgraphData | null;
  loading?: boolean;
  analystRole: 'L1' | 'L2';
  onApproveAction: (actionName: string, route: string, decision: 'approve' | 'reject') => void;
  isRunning?: boolean;
  cases?: CaseSummary[];
  selectedCaseId?: string;
  onSelectCase?: (caseId: string) => void;
}

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  caseData,
  subgraph,
  loading,
  analystRole,
  onApproveAction,
  isRunning,
  cases = [],
  selectedCaseId = '',
  onSelectCase,
}) => {
  const [sarOpen, setSarOpen] = useState(false);
  const [inboxCollapsed, setInboxCollapsed] = useState(false);

  if (loading || !caseData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
        <div className="skeleton" style={{ height: '70px', width: '100%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 380px', gap: '14px', flex: 1 }}>
          <div className="skeleton" style={{ height: '100%' }} />
          <div className="skeleton" style={{ height: '100%' }} />
          <div className="skeleton" style={{ height: '100%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-container">
      {/* 3-Column Modular Workbench */}
      <div
        className="workspace-grid"
        style={{
          gridTemplateColumns: inboxCollapsed ? '48px 1fr 380px' : '260px 1fr 380px',
          transition: 'grid-template-columns 0.2s ease',
        }}
      >
        {/* COLUMN 1: CASE INBOX (LEFT 260px) */}
        <CaseInbox
          cases={cases}
          selectedCaseId={selectedCaseId || caseData.case_id}
          onSelectCase={(id) => onSelectCase && onSelectCase(id)}
          collapsed={inboxCollapsed}
          onToggleCollapse={() => setInboxCollapsed(!inboxCollapsed)}
        />

        {/* COLUMN 2: MAIN CANVAS (CENTER flex-1) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0, overflowY: 'auto' }}>
          {/* Header Banner */}
          <CaseHeader caseData={caseData} onOpenSAR={() => setSarOpen(true)} />

          {/* TigerGraph Interactive Subgraph Topology */}
          <div style={{ minHeight: '380px', height: '420px', flexShrink: 0 }}>
            <GraphExplorer subgraph={subgraph} loading={loading} />
          </div>

          {/* Live Agentic Reasoning Trace (6-Stage Loop) */}
          <div style={{ flex: '1 0 auto', minHeight: '340px', flexShrink: 0 }}>
            <AgentActivityFeed caseData={caseData} isRunning={isRunning} />
          </div>

          {/* Timeline */}
          <div style={{ flexShrink: 0 }}>
            <InvestigationTimeline caseData={caseData} />
          </div>
        </div>

        {/* COLUMN 3: INSPECTOR & ACTIONS (RIGHT 380px) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', minHeight: 0 }}>
          {/* Uncertainty & Probability Gauge */}
          <UncertaintyGauge caseData={caseData} />

          {/* Dual-State Next Best Action Card */}
          <NextBestActionCard
            caseData={caseData}
            analystRole={analystRole}
            onApproveAction={onApproveAction}
            onOpenSAR={() => setSarOpen(true)}
          />

          {/* Evidence Dossier & Policies */}
          <EvidencePanel caseData={caseData} />

          {/* Case Memory: Similar Prior Cases via Vector Memory */}
          <CaseMemoryCard caseData={caseData} />
        </div>
      </div>

      {/* Standalone FinCEN Suspicious Activity Report (SAR) Drawer */}
      <AnimatePresence>
        {sarOpen && caseData.sar && (
          <SARDrawer
            isOpen={sarOpen}
            onClose={() => setSarOpen(false)}
            caseId={caseData.case_id}
            sar={caseData.sar}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
