import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Shield,
  Activity,
  Sparkles,
  ChevronDown,
  Check,
  X,
  FileText,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Layers,
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
  const [isCaseMenuOpen, setIsCaseMenuOpen] = useState(false);
  const caseMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (caseMenuRef.current && !caseMenuRef.current.contains(e.target as Node)) {
        setIsCaseMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCase = cases.find((c) => c.case_id === selectedCaseId) || cases[0];

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview':
        return 'Command Center & Triage Queue';
      case 'investigation':
        return 'Agentic Workspace';
      case 'cases':
        return 'Benchmark & Historical Memory';
      case 'transactions':
        return 'High-Velocity Transactions';
      case 'entities':
        return 'Graph Subgraph Explorer';
      case 'policies':
        return 'Fraud Policy Rules (R1–R10)';
      case 'audit':
        return 'Audit Log & Analyst Decisions';
      default:
        return 'Investigation Ops';
    }
  };

  const getVerdictBadge = (verdict: string) => {
    if (verdict === 'fraud') {
      return (
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '9999px',
            background: 'rgba(244, 63, 94, 0.18)',
            color: '#f43f5e',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            letterSpacing: '0.03em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <ShieldAlert size={10} /> FRAUD
        </span>
      );
    }
    if (verdict === 'legitimate') {
      return (
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.18)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            letterSpacing: '0.03em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <ShieldCheck size={10} /> CLEARED
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
          background: 'rgba(245, 158, 11, 0.18)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          letterSpacing: '0.03em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
        }}
      >
        <AlertTriangle size={10} /> SUSPICIOUS
      </span>
    );
  };

  return (
    <header
      className="topbar"
      style={{
        height: '52px',
        background: 'rgba(12, 14, 20, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 1px 0 0 rgba(255, 255, 255, 0.04), 0 4px 20px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        flexShrink: 0,
        zIndex: 50,
        position: 'relative',
      }}
    >
      {/* LEFT: Contextual Breadcrumb & Interactive Case Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        {/* Breadcrumb Hierarchy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#71717a',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}
          >
            INVESTIGATION OPS
          </span>
          <span style={{ color: '#3f3f46', fontSize: '12px' }}>/</span>
          <h1
            style={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#f4f4f5',
              margin: 0,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            {getTabTitle(currentTab)}
          </h1>
        </div>

        {/* Vertical Divider */}
        {cases.length > 0 && (
          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.1)', flexShrink: 0 }} />
        )}

        {/* Sleek Contextual Case Selector Popover */}
        {cases.length > 0 && selectedCase && (
          <div ref={caseMenuRef} style={{ position: 'relative' }}>
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCaseMenuOpen(!isCaseMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isCaseMenuOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: isCaseMenuOpen
                  ? '1px solid rgba(56, 189, 248, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '7px',
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isCaseMenuOpen ? '0 0 14px rgba(14, 165, 233, 0.25)' : 'none',
              }}
            >
              {/* Status Glow Dot */}
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background:
                    selectedCase.verdict === 'fraud'
                      ? '#f43f5e'
                      : selectedCase.verdict === 'legitimate'
                      ? '#10b981'
                      : '#f59e0b',
                  boxShadow: `0 0 8px ${
                    selectedCase.verdict === 'fraud'
                      ? 'rgba(244, 63, 94, 0.8)'
                      : selectedCase.verdict === 'legitimate'
                      ? 'rgba(16, 185, 129, 0.8)'
                      : 'rgba(245, 158, 11, 0.8)'
                  }`,
                  flexShrink: 0,
                }}
              />

              {/* Case ID */}
              <span
                className="mono"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  letterSpacing: '0.02em',
                }}
              >
                {selectedCase.case_id}
              </span>

              {/* Verdict Tag */}
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color:
                    selectedCase.verdict === 'fraud'
                      ? '#fda4af'
                      : selectedCase.verdict === 'legitimate'
                      ? '#6ee7b7'
                      : '#fde68a',
                  textTransform: 'uppercase',
                }}
              >
                {selectedCase.verdict === 'fraud'
                  ? 'Confirmed Fraud'
                  : selectedCase.verdict === 'legitimate'
                  ? 'Cleared'
                  : 'Suspicious'}
              </span>

              {selectedCase.risk_score !== null && (
                <span
                  className="mono"
                  style={{
                    fontSize: '10.5px',
                    color: '#71717a',
                    fontWeight: 600,
                  }}
                >
                  ({selectedCase.risk_score}%)
                </span>
              )}

              {/* Animated Chevron */}
              <motion.div
                animate={{ rotate: isCaseMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.15 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <ChevronDown size={13} color="#a1a1aa" />
              </motion.div>
            </motion.button>

            {/* Custom Frosted Glass Case Directory Dropdown */}
            <AnimatePresence>
              {isCaseMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={snappyTransition}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '380px',
                    background: 'rgba(14, 16, 24, 0.96)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}
                >
                  {/* Dropdown Header */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={13} color="#38bdf8" />
                      <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em', color: '#f4f4f5', textTransform: 'uppercase' }}>
                        Active Case Switcher
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
                      {cases.length} cases loaded
                    </span>
                  </div>

                  {/* Case List Scroll Area */}
                  <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '6px' }}>
                    {cases.map((c) => {
                      const isCurrent = c.case_id === selectedCaseId;
                      return (
                        <motion.div
                          key={c.case_id}
                          whileHover={{ x: 2, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                          onClick={() => {
                            onSelectCase(c.case_id);
                            setIsCaseMenuOpen(false);
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '7px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            background: isCurrent ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                            border: isCurrent
                              ? '1px solid rgba(56, 189, 248, 0.25)'
                              : '1px solid transparent',
                            marginBottom: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Checkmark or empty space */}
                            <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
                              {isCurrent && <Check size={14} color="#38bdf8" />}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: '#f4f4f5' }}>
                                  {c.case_id}
                                </span>
                                {getVerdictBadge(c.verdict)}
                                {c.risk_score !== null && (
                                  <span
                                    className="mono"
                                    style={{
                                      fontSize: '10.5px',
                                      fontWeight: 600,
                                      color: c.risk_score >= 70 ? '#f43f5e' : c.risk_score <= 30 ? '#10b981' : '#f59e0b',
                                    }}
                                  >
                                    {c.risk_score}%
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#71717a', marginTop: '2px', textTransform: 'capitalize' }}>
                                {c.pattern ? c.pattern.replace(/_/g, ' ') : 'Routine transaction'} • {c.customer_id}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#a1a1aa',
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                              }}
                            >
                              {c.status || 'Active'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* CENTER: Omnisearch Command Bar */}
      <motion.div
        animate={{ width: isSearchFocused ? 380 : 280 }}
        transition={snappyTransition}
        style={{ position: 'relative' }}
      >
        <Search
          size={13}
          color={isSearchFocused ? '#38bdf8' : '#71717a'}
          style={{
            position: 'absolute',
            left: '11px',
            top: '50%',
            transform: 'translateY(-50%)',
            transition: 'color 0.15s ease',
            pointerEvents: 'none',
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
            background: isSearchFocused ? 'rgba(10, 12, 18, 0.95)' : 'rgba(0, 0, 0, 0.35)',
            border: isSearchFocused
              ? '1px solid rgba(56, 189, 248, 0.55)'
              : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: isSearchFocused
              ? '0 0 16px rgba(14, 165, 233, 0.22), inset 0 1px 2px rgba(0, 0, 0, 0.4)'
              : 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
            borderRadius: '7px',
            padding: '6px 36px 6px 32px',
            color: '#f4f4f5',
            fontSize: '11.5px',
            outline: 'none',
            transition: 'all 0.18s ease',
          }}
        />

        {searchQuery ? (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#71717a',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            <X size={12} />
          </button>
        ) : (
          <kbd
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 5px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: isSearchFocused ? '#38bdf8' : '#71717a',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              pointerEvents: 'none',
            }}
          >
            ⌘K
          </kbd>
        )}
      </motion.div>

      {/* RIGHT: Agent Trigger, Security Clearance Switcher & Live Engine Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Re-run Agent (Workspace only) */}
        {onRunActiveCase && currentTab === 'investigation' && (
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRunActiveCase}
            disabled={isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              background: isRunning
                ? 'rgba(56, 189, 248, 0.15)'
                : 'linear-gradient(135deg, rgba(14, 165, 233, 0.8), rgba(2, 132, 199, 0.9))',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 14px rgba(14, 165, 233, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={12} />
            <span>{isRunning ? 'Deliberating...' : 'Re-run Agent'}</span>
          </motion.button>
        )}

        {/* Security Clearance Switcher with Fluid Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(18, 20, 28, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '7px',
            padding: '2px',
            position: 'relative',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#71717a',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              letterSpacing: '0.04em',
            }}
          >
            <Shield size={11} color="#71717a" />
            <span>ROLE:</span>
          </div>

          <button
            onClick={() => onToggleAnalystRole('L1')}
            style={{
              position: 'relative',
              padding: '3px 9px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: analystRole === 'L1' ? '#fbbf24' : '#a1a1aa',
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
                  borderRadius: '5px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.1))',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)',
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
              padding: '3px 9px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: analystRole === 'L2' ? '#38bdf8' : '#a1a1aa',
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
                  borderRadius: '5px',
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(14, 165, 233, 0.1))',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  boxShadow: '0 0 10px rgba(14, 165, 233, 0.2)',
                  zIndex: -1,
                }}
              />
            )}
            L2 Manager
          </button>
        </div>

        {/* High-Tech TigerGraph MCP Telemetry Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
            padding: '4px 9px',
            borderRadius: '7px',
            fontSize: '11px',
            color: '#38bdf8',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
          title="TigerGraph 3.9 REST++ & LangGraph Agent Runtime Connected"
        >
          <Activity size={12} color="#38bdf8" />
          <span>TG MCP</span>
          <span style={{ color: '#3f3f46' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <motion.span
              animate={{ scale: [1, 1.35, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            <span
              className="mono"
              style={{
                color: '#10b981',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              12ms
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
