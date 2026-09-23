import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Shield,
  Activity,
  Sparkles,
} from 'lucide-react';
import { CaseSummary } from '../../types';
import { snappyTransition } from '../../utils/motion';

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

      {/* Center: Universal Search with Fluid Expand/Contract Animation */}
      <motion.div
        animate={{ width: isSearchFocused ? 360 : 260 }}
        transition={snappyTransition}
        style={{ position: 'relative' }}
      >
        <Search
          size={14}
          color={isSearchFocused ? 'var(--brand-tiger)' : 'var(--text-muted)'}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            transition: 'color 0.2s ease',
          }}
        />
        <input
          type="text"
          placeholder="Search cases, cards, txns..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          style={{
            width: '100%',
            background: isSearchFocused ? 'rgba(15, 23, 42, 0.9)' : 'var(--bg-input)',
            border: isSearchFocused ? '1px solid rgba(14, 165, 233, 0.6)' : '1px solid var(--border-default)',
            boxShadow: isSearchFocused ? '0 0 12px rgba(14, 165, 233, 0.2)' : 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 32px 5px 30px',
            color: 'var(--text-primary)',
            fontSize: '12px',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
        />
        <kbd
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '1px 5px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            color: isSearchFocused ? 'var(--brand-tiger)' : 'var(--text-muted)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            pointerEvents: 'none',
          }}
        >
          ⌘K
        </kbd>
      </motion.div>

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

        {/* Clearance Role Switcher with Animated Sliding Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            position: 'relative',
          }}
        >
          <div style={{ padding: '2px 6px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', zIndex: 1 }}>
            <Shield size={11} /> ROLE:
          </div>

          <button
            onClick={() => onToggleAnalystRole('L1')}
            style={{
              position: 'relative',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: analystRole === 'L1' ? '#000' : 'var(--text-secondary)',
              zIndex: 1,
              transition: 'color 0.15s ease',
            }}
          >
            {analystRole === 'L1' && (
              <motion.div
                layoutId="roleActivePill"
                transition={snappyTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--route-l1)',
                  zIndex: -1,
                }}
              />
            )}
            L1 Lead
          </button>

          <button
            onClick={() => onToggleAnalystRole('L2')}
            style={{
              position: 'relative',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: analystRole === 'L2' ? '#fff' : 'var(--text-secondary)',
              zIndex: 1,
              transition: 'color 0.15s ease',
            }}
          >
            {analystRole === 'L2' && (
              <motion.div
                layoutId="roleActivePill"
                transition={snappyTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--route-l2)',
                  zIndex: -1,
                }}
              />
            )}
            L2 Manager
          </button>
        </div>

        {/* TigerGraph Engine Status Badge with Micro-pulse indicator */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <motion.span
              animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            <span style={{ color: 'var(--risk-low)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>12ms</span>
          </div>
        </div>
      </div>
    </header>
  );
};

