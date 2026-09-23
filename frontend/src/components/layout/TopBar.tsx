import React from 'react';
import {
  Search,
  Shield,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CaseSummary } from '../../types';

interface TopBarProps {
  currentTab: string;
  cases: CaseSummary[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  analystRole: 'L1' | 'L2';
  onToggleAnalystRole: (role: 'L1' | 'L2') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRunActiveCase?: () => void;
  isRunning?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  cases,
  selectedCaseId,
  onSelectCase,
  analystRole,
  onToggleAnalystRole,
  searchQuery,
  onSearchChange,
  onRunActiveCase,
  isRunning = false,
}) => {
  return (
    <header className="topbar">
      {/* Left: View title & Demo Case Quick Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            INVESTIGATION OPS
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {currentTab === 'overview' && 'Command Center & Triage Queue'}
              {currentTab === 'investigation' && 'Agentic Workspace'}
              {currentTab === 'cases' && 'Benchmark & Historical Memory'}
              {currentTab === 'transactions' && 'High-Velocity Transactions'}
              {currentTab === 'entities' && 'Graph Subgraph Explorer'}
              {currentTab === 'policies' && 'Fraud Policy Rules (R1–R10)'}
              {currentTab === 'audit' && 'Audit Log & Analyst Decisions'}
            </h1>

            {/* Quick Case Switcher for Demo */}
            {cases.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Case:</span>
                <select
                  value={selectedCaseId}
                  onChange={(e) => onSelectCase(e.target.value)}
                  style={{
                    background: 'var(--bg-card-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--brand-tiger)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {cases.map((c) => (
                    <option key={c.case_id} value={c.case_id} style={{ background: '#0d1524', color: '#fff' }}>
                      {c.case_id} — {c.verdict.toUpperCase()} ({c.pattern})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: Universal Search */}
      <div style={{ position: 'relative', width: '280px' }}>
        <Search
          size={14}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Filter cases, cards, txns..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px 5px 30px',
            color: 'var(--text-primary)',
            fontSize: '12px',
            outline: 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--brand-tiger)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
        />
      </div>

      {/* Right Controls: Role Clearance, Re-run agent, Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Run / Live Agent Trigger */}
        {onRunActiveCase && currentTab === 'investigation' && (
          <button
            onClick={onRunActiveCase}
            disabled={isRunning}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={13} />
            <span>{isRunning ? 'Deliberating...' : 'Re-run Agent'}</span>
          </button>
        )}

        {/* Clearance Role Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
          }}
        >
          <div style={{ padding: '2px 6px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Shield size={11} /> ROLE:
          </div>
          <button
            onClick={() => onToggleAnalystRole('L1')}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: analystRole === 'L1' ? 'var(--route-l1)' : 'transparent',
              color: analystRole === 'L1' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.1s ease',
            }}
          >
            L1 Lead
          </button>
          <button
            onClick={() => onToggleAnalystRole('L2')}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: analystRole === 'L2' ? 'var(--route-l2)' : 'transparent',
              color: analystRole === 'L2' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.1s ease',
            }}
          >
            L2 Manager
          </button>
        </div>

        {/* TigerGraph Engine Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--brand-tiger)',
            fontWeight: 600,
          }}
        >
          <Activity size={12} color="var(--brand-tiger)" />
          <span>TG MCP</span>
          <span style={{ color: 'var(--risk-low)', fontSize: '9px' }}>● 12ms</span>
        </div>
      </div>
    </header>
  );
};
