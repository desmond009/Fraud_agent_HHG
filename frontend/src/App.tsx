import React, { useState, useEffect } from 'react';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandCenter } from './components/pages/CommandCenter';
import { CaseManagement } from './components/pages/CaseManagement';
import { TransactionExplorer } from './components/pages/TransactionExplorer';
import { PoliciesView } from './components/pages/PoliciesView';
import { AuditLogView } from './components/pages/AuditLogView';
import { InvestigationWorkspace } from './components/workspace/InvestigationWorkspace';
import { GraphExplorer } from './components/workspace/GraphExplorer';

import {
  CaseSummary,
  CaseDetail,
  SubgraphData,
  PolicyRule,
} from './types';
import {
  fetchCases,
  fetchCaseDetail,
  fetchCaseSubgraph,
  submitAnalystAction,
  runCaseInvestigation,
  fetchPolicies,
} from './api/client';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItem>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [analystRole, setAnalystRole] = useState<'L1' | 'L2'>('L1');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('HHG-005');
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [subgraph, setSubgraph] = useState<SubgraphData | null>(null);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  
  // Loading & status
  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Load of Cases & Policies
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingCases(true);
    try {
      const [casesData, policiesData] = await Promise.all([
        fetchCases(),
        fetchPolicies(),
      ]);
      setCases(casesData);
      setPolicies(policiesData);
    } catch (e) {
      console.error('Failed to load initial cases:', e);
    } finally {
      setLoadingCases(false);
    }
  };

  // 2. Load Selected Case Detail & Subgraph
  useEffect(() => {
    if (!selectedCaseId) return;
    loadSelectedCase(selectedCaseId);
  }, [selectedCaseId]);

  const loadSelectedCase = async (id: string) => {
    setLoadingDetail(true);
    try {
      const [detail, sub] = await Promise.all([
        fetchCaseDetail(id),
        fetchCaseSubgraph(id),
      ]);
      setCaseDetail(detail);
      setSubgraph(sub);
    } catch (e) {
      console.error(`Failed to load case ${id}:`, e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentTab('investigation');
  };

  // 3. Human Approval Sign-off Handler
  const handleApproveAction = async (actionName: string, route: string, decision: 'approve' | 'reject') => {
    if (!selectedCaseId) return;

    try {
      const res = await submitAnalystAction(selectedCaseId, {
        decision,
        action_name: actionName,
        route,
        analyst_name: analystRole === 'L2' ? 'Fraud Manager' : 'Sarah Lin (Lead)',
        analyst_role: analystRole === 'L2' ? 'L2 Fraud Manager' : 'L1 Team Lead',
        notes: `Approved under ${route} routing guidelines.`,
      });


      if (res.success) {
        showToast(`Action ${actionName} successfully ${decision}d by ${analystRole} officer.`);
        // Refresh case detail
        loadSelectedCase(selectedCaseId);
        // Refresh cases list for status sync
        fetchCases().then(setCases);
      }
    } catch (e) {
      console.error(e);
      showToast('Error recording analyst action');
    }
  };

  // 4. Re-run LangGraph Agent
  const handleRunActiveCase = async () => {
    if (!selectedCaseId || isRunningAgent) return;
    setIsRunningAgent(true);
    showToast(`Invoking LangGraph 6-node agent for ${selectedCaseId}...`);

    try {
      const res = await runCaseInvestigation(selectedCaseId);
      if (res.success) {
        showToast(`Investigation finished in ${res.data.latency_s}s. TigerGraph writeback confirmed.`);
        loadSelectedCase(selectedCaseId);
        fetchCases().then(setCases);
      }
    } catch (e) {
      console.error(e);
      showToast('Agent execution error');
    } finally {
      setIsRunningAgent(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        stats={{
          activeCasesCount: cases.length,
          pendingApprovalsCount: cases.filter((c) => c.approval?.status === 'pending').length,
          sarCount: cases.filter((c) => c.sar_filed).length,
        }}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* TopBar Header */}
        <TopBar
          currentTab={currentTab}
          cases={cases}
          selectedCaseId={selectedCaseId}
          onSelectCase={handleSelectCase}
          analystRole={analystRole}
          onToggleAnalystRole={setAnalystRole}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRunActiveCase={handleRunActiveCase}
          isRunning={isRunningAgent}
        />

        {/* Dynamic Page Body */}
        <main className="page-body">
          {currentTab === 'overview' && (
            <CommandCenter
              cases={cases}
              onOpenCase={handleSelectCase}
              loading={loadingCases}
            />
          )}

          {currentTab === 'investigation' && (
            <InvestigationWorkspace
              caseData={caseDetail}
              subgraph={subgraph}
              loading={loadingDetail}
              analystRole={analystRole}
              onApproveAction={handleApproveAction}
              isRunning={isRunningAgent}
              cases={cases}
              selectedCaseId={selectedCaseId}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentTab === 'cases' && (
            <CaseManagement
              cases={cases}
              onOpenCase={handleSelectCase}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionExplorer
              onInvestigateCase={handleSelectCase}
            />
          )}

          {currentTab === 'entities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  TigerGraph Interactive Subgraph Topology
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Explore connected cards, shared device identifiers, and historical fraud memory for Case {selectedCaseId}.
                </p>
              </div>
              <div style={{ flex: 1, minHeight: '520px' }}>
                <GraphExplorer subgraph={subgraph} loading={loadingDetail} />
              </div>
            </div>
          )}

          {currentTab === 'policies' && (
            <PoliciesView
              policies={policies}
              onInvestigateCase={handleSelectCase}
            />
          )}

          {currentTab === 'audit' && (
            <AuditLogView onInvestigateCase={handleSelectCase} />
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--brand-tiger)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div className="live-dot" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
