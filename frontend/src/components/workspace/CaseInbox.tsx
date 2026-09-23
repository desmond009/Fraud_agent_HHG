import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, ShieldAlert, ChevronLeft } from 'lucide-react';
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
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
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
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
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
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: 'var(--bg-sidebar)',
        border: '1px solid var(--border-default)',
      }}
    >
      {/* Header & Collapse */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={14} color="var(--brand-tiger)" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
            Investigation Queue
          </span>
          <span
            className="mono"
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
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
              padding: '2px',
            }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 8px',
          }}
        >
          <Search size={12} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter queue or IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '11px',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Quick Filter Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
          {(['all', 'high', 'pending'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              style={{
                flex: 1,
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'capitalize',
                padding: '3px 0',
                borderRadius: 'var(--radius-sm)',
                border: filterMode === m ? '1px solid var(--border-active)' : '1px solid transparent',
                background: filterMode === m ? 'var(--bg-card-elevated)' : 'transparent',
                color: filterMode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {m === 'high' ? 'High Risk' : m}
            </button>
          ))}
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
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
            No matching cases found.
          </div>
        ) : (
          filtered.map((c) => {
            const isSelected = c.case_id === selectedCaseId;
            const risk = c.risk_score ?? Math.round((c.fraud_probability || 0) * 100);
            const isHigh = risk >= 70;
            const isMed = risk >= 40 && risk < 70;

            const badgeBg = isHigh ? 'var(--risk-high-bg)' : isMed ? 'var(--risk-medium-bg)' : 'var(--risk-low-bg)';
            const badgeBorder = isHigh ? 'var(--risk-high-border)' : isMed ? 'var(--risk-medium-border)' : 'var(--risk-low-border)';
            const badgeColor = isHigh ? 'var(--risk-high)' : isMed ? 'var(--risk-medium)' : 'var(--risk-low)';

            return (
              <motion.div
                key={c.case_id}
                layout
                onClick={() => onSelectCase(c.case_id)}
                style={{
                  position: 'relative',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: '1px solid transparent',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeQueueItem"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      boxShadow: '0 0 12px rgba(14, 165, 233, 0.15)',
                      zIndex: 0,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                {/* Top Line: ID & Risk Pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {c.case_id}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                      background: badgeBg,
                      border: `1px solid ${badgeBorder}`,
                      color: badgeColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isHigh && (
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: '#f43f5e',
                          boxShadow: '0 0 6px #f43f5e',
                          animation: 'pulse-ring 2s infinite',
                        }}
                      />
                    )}
                    Risk {risk}
                  </span>
                </div>

                {/* Subtitle / Customer */}
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ fontWeight: 600 }}>{c.customer_id}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {c.opened_at ? new Date(c.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </span>
                </div>

                {/* Trigger Snippet */}
                <div
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
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
                  <span className="mono" style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${(c.exposure_usd || 0).toLocaleString()} USD
                  </span>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: c.status.toLowerCase().includes('pending') ? 'var(--risk-medium)' : 'var(--text-muted)', fontWeight: 600 }}>
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
          borderTop: '1px solid var(--border-default)',
          background: 'var(--bg-topbar)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="live-dot" />
          <span>GraphRAG Vector Active</span>
        </div>
      </div>
    </aside>
  );
};
