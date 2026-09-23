import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ShieldAlert, ChevronLeft, X } from 'lucide-react';
import { CaseSummary } from '../../types';

interface CaseInboxProps {
  cases: CaseSummary[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CaseInbox: React.FC<CaseInboxProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  collapsed = false,
  onToggleCollapse,
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'high' | 'pending'>('all');

  const filtered = cases.filter((c) => {
    // Filter mode
    if (filterMode === 'high' && (c.risk_score === null || c.risk_score < 70)) return false;
    if (filterMode === 'pending' && c.approval?.status !== 'pending' && !c.status.toLowerCase().includes('pending')) {
      return false;
    }
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = c.case_id.toLowerCase().includes(q);
      const matchCust = c.customer_id.toLowerCase().includes(q);
      const matchTrigger = c.trigger_text.toLowerCase().includes(q);
      const matchCard = c.card_id.toLowerCase().includes(q);
      return matchId || matchCust || matchTrigger || matchCard;
    }
    return true;
  });

  if (collapsed) {
    return (
      <aside
        style={{
          width: '48px',
          background: 'rgba(16, 16, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          gap: '12px',
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="btn-icon"
          title="Expand Case Inbox"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-secondary)',
            borderRadius: '6px',
            padding: '6px',
            cursor: 'pointer',
          }}
        >
          <ChevronRight size={14} />
        </button>
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
          CASE INBOX ({cases.length})
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: 'rgba(16, 16, 22, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header & Collapse */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '5px',
              background: 'rgba(14, 165, 233, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={12} color="#38bdf8" />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f4f4f5' }}>
            Investigation Queue
          </span>
          <span
            className="mono"
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '9999px',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontWeight: 700,
            }}
          >
            {cases.length}
          </span>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '5px 8px',
            transition: 'border-color 0.15s ease',
          }}
        >
          <Search size={12} color="#71717a" />
          <input
            type="text"
            placeholder="Filter queue or IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f4f4f5',
              fontSize: '11px',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Quick Filter Tabs with Sliding Motion Indicator */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            gap: '2px',
            marginTop: '6px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          {(['all', 'high', 'pending'] as const).map((m) => {
            const isActive = filterMode === m;
            return (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                style={{
                  position: 'relative',
                  flex: 1,
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  padding: '3px 0',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#f4f4f5' : '#71717a',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  zIndex: 2,
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="inboxFilterIndicator"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      zIndex: -1,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                {m === 'high' ? 'High Risk' : m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cases List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '6px',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: '#71717a', fontSize: '11px' }}>
            No matching cases found.
          </div>
        ) : (
          filtered.map((c) => {
            const isSelected = c.case_id === selectedCaseId;
            const risk = c.risk_score ?? Math.round((c.fraud_probability || 0) * 100);
            const isHigh = risk >= 70;
            const isMed = risk >= 40 && risk < 70;

            const badgeBg = isHigh ? 'rgba(244, 63, 94, 0.15)' : isMed ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';
            const badgeBorder = isHigh ? 'rgba(244, 63, 94, 0.35)' : isMed ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)';
            const badgeColor = isHigh ? '#f43f5e' : isMed ? '#f59e0b' : '#10b981';

            return (
              <motion.div
                key={c.case_id}
                layout
                whileHover={{ x: 2 }}
                onClick={() => onSelectCase(c.case_id)}
                style={{
                  position: 'relative',
                  padding: '9px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: isSelected ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                  boxShadow: isSelected ? '0 0 14px rgba(14, 165, 233, 0.15)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  overflow: 'hidden',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
              >
                {/* Active Indicator Left Accent Bar */}
                {isSelected && (
                  <motion.div
                    layoutId="activeQueueBar"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      background: 'linear-gradient(180deg, #38bdf8, #0ea5e9)',
                      boxShadow: '0 0 8px #38bdf8',
                      zIndex: 2,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                {/* Top Line: ID & Risk Pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: isSelected ? '#38bdf8' : '#f4f4f5' }}>
                    {c.case_id}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      background: badgeBg,
                      border: `1px solid ${badgeBorder}`,
                      color: badgeColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isHigh && (
                      <motion.span
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1.4 }}
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: '#f43f5e',
                          boxShadow: '0 0 6px #f43f5e',
                          display: 'inline-block',
                        }}
                      />
                    )}
                    Risk {risk}
                  </span>
                </div>

                {/* Subtitle / Customer */}
                <div style={{ fontSize: '11px', color: '#a1a1aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ fontWeight: 600 }}>{c.customer_id}</span>
                  <span style={{ fontSize: '10px', color: '#71717a' }}>
                    {c.opened_at ? new Date(c.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </span>
                </div>

                {/* Trigger Snippet */}
                <div
                  style={{
                    fontSize: '10.5px',
                    color: '#71717a',
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {c.trigger_text}
                </div>

                {/* Bottom details */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span className="mono" style={{ fontSize: '10.5px', fontWeight: 700, color: '#f4f4f5' }}>
                    ${(c.exposure_usd || 0).toLocaleString()} USD
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      textTransform: 'uppercase',
                      color: c.status.toLowerCase().includes('pending') ? '#f59e0b' : '#71717a',
                      fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                    }}
                  >
                    {c.status}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Bottom Status bar */}
      <div
        style={{
          padding: '8px 10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#71717a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 6px #38bdf8',
            }}
          />
          <span>GraphRAG Vector Active</span>
        </div>
      </div>
    </aside>
  );
};

