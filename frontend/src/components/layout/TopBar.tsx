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
            background: 'rgba(220, 60, 69, 0.18)',
            color: '#dc3c45',
            border: '1px solid rgba(220, 60, 69, 0.4)',
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
            background: 'rgba(5, 150, 105, 0.18)',
            color: '#059669',
            border: '1px solid rgba(5, 150, 105, 0.4)',
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
          background: 'rgba(217, 130, 11, 0.18)',
          color: '#d9820b',
          border: '1px solid rgba(217, 130, 11, 0.4)',
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
        background: 'rgba(255, 255, 255, 0.96)',
        borderBottom: '1px solid rgba(71, 85, 140, 0.104)',
        boxShadow: 'none',
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
            className="crumb-root"
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#6b7388',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}
          >
            INVESTIGATION OPS
          </span>
          <span className="crumb-root" style={{ color: '#b4bccd', fontSize: '12px' }}>/</span>
          <h1
            style={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#1f2638',
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
          <div style={{ width: '1px', height: '18px', background: 'rgba(71, 85, 140, 0.13)', flexShrink: 0 }} />
        )}

        {/* Sleek Contextual Case Selector Popover */}
        {cases.length > 0 && selectedCase && (
          <div ref={caseMenuRef} style={{ position: 'relative' }}>
            <motion.button
              whileHover={{ backgroundColor: 'rgba(71, 85, 140, 0.078)' }}
              whileTap={{}}
              onClick={() => setIsCaseMenuOpen(!isCaseMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isCaseMenuOpen ? 'rgba(71, 85, 140, 0.104)' : 'rgba(71, 85, 140, 0.039)',
                border: isCaseMenuOpen
                  ? '1px solid rgba(79, 99, 210, 0.5)'
                  : '1px solid rgba(71, 85, 140, 0.117)',
                borderRadius: '5px',
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isCaseMenuOpen ? 'none' : 'none',
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
                      ? '#dc3c45'
                      : selectedCase.verdict === 'legitimate'
                      ? '#059669'
                      : '#d9820b',
                  boxShadow: 'none',
                  flexShrink: 0,
                }}
              />

              {/* Case ID */}
              <span
                className="mono"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#4f63d2',
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
                    color: '#6b7388',
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
                <ChevronDown size={13} color="#556078" />
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
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid rgba(71, 85, 140, 0.156)',
                    borderRadius: '6px',
                    boxShadow: 'none',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}
                >
                  {/* Dropdown Header */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(71, 85, 140, 0.104)',
                      background: 'rgba(71, 85, 140, 0.026)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={13} color="#4f63d2" />
                      <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em', color: '#1f2638', textTransform: 'uppercase' }}>
                        Active Case Switcher
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#6b7388', fontFamily: 'var(--font-mono)' }}>
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
                          whileHover={{ x: 2, backgroundColor: 'rgba(71, 85, 140, 0.052)' }}
                          onClick={() => {
                            onSelectCase(c.case_id);
                            setIsCaseMenuOpen(false);
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            background: isCurrent ? 'rgba(79, 99, 210, 0.08)' : 'transparent',
                            border: isCurrent
                              ? '1px solid rgba(79, 99, 210, 0.25)'
                              : '1px solid transparent',
                            marginBottom: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Checkmark or empty space */}
                            <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
                              {isCurrent && <Check size={14} color="#4f63d2" />}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: '#1f2638' }}>
                                  {c.case_id}
                                </span>
                                {getVerdictBadge(c.verdict)}
                                {c.risk_score !== null && (
                                  <span
                                    className="mono"
                                    style={{
                                      fontSize: '10.5px',
                                      fontWeight: 600,
                                      color: c.risk_score >= 70 ? '#dc3c45' : c.risk_score <= 30 ? '#059669' : '#d9820b',
                                    }}
                                  >
                                    {c.risk_score}%
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#6b7388', marginTop: '2px', textTransform: 'capitalize' }}>
                                {c.pattern ? c.pattern.replace(/_/g, ' ') : 'Routine transaction'} • {c.customer_id}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#556078',
                                background: 'rgba(71, 85, 140, 0.065)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(71, 85, 140, 0.078)',
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
          color={isSearchFocused ? '#4f63d2' : '#6b7388'}
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
            background: isSearchFocused ? 'rgba(255, 255, 255, 0.96)' : 'rgba(40, 50, 100, 0.098)',
            border: isSearchFocused
              ? '1px solid rgba(79, 99, 210, 0.55)'
              : '1px solid rgba(71, 85, 140, 0.104)',
            boxShadow: isSearchFocused
              ? 'none'
              : 'none',
            borderRadius: '5px',
            padding: '6px 36px 6px 32px',
            color: '#1f2638',
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
              color: '#6b7388',
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
              background: 'rgba(71, 85, 140, 0.078)',
              color: isSearchFocused ? '#4f63d2' : '#6b7388',
              border: '1px solid rgba(71, 85, 140, 0.117)',
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
            whileHover={{}}
            whileTap={{}}
            onClick={onRunActiveCase}
            disabled={isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              background: isRunning
                ? 'rgba(79, 99, 210, 0.15)'
                : '#4f63d2',
              border: '1px solid rgba(79, 99, 210, 0.45)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              boxShadow: 'none',
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
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(71, 85, 140, 0.117)',
            borderRadius: '5px',
            padding: '2px',
            position: 'relative',
            boxShadow: 'none',
          }}
        >
          <div
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#6b7388',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              letterSpacing: '0.04em',
            }}
          >
            <Shield size={11} color="#6b7388" />
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
              color: analystRole === 'L1' ? '#fbbf24' : '#556078',
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
                  background: 'linear-gradient(135deg, rgba(217, 130, 11, 0.22), rgba(217, 130, 11, 0.1))',
                  border: '1px solid rgba(217, 130, 11, 0.5)',
                  boxShadow: 'none',
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
              color: analystRole === 'L2' ? '#4f63d2' : '#556078',
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
                  background: 'linear-gradient(135deg, rgba(79, 99, 210, 0.22), rgba(79, 99, 210, 0.1))',
                  border: '1px solid rgba(79, 99, 210, 0.5)',
                  boxShadow: 'none',
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
            background: 'rgba(79, 99, 210, 0.08)',
            border: '1px solid rgba(79, 99, 210, 0.25)',
            boxShadow: 'none',
            padding: '4px 9px',
            borderRadius: '5px',
            fontSize: '11px',
            color: '#4f63d2',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
          title="TigerGraph 3.9 REST++ & LangGraph Agent Runtime Connected"
        >
          <Activity size={12} color="#4f63d2" />
          <span>TG MCP</span>
          <span style={{ color: '#b4bccd' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <motion.span
              animate={{ scale: [1, 1.35, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#059669',
                boxShadow: 'none',
              }}
            />
            <span
              className="mono"
              style={{
                color: '#059669',
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
