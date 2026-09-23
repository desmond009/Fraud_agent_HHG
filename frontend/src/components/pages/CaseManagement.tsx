import React, { useState } from 'react';
import {
  FolderGit2,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  FileText,
  Database,
} from 'lucide-react';
import { CaseSummary } from '../../types';

interface CaseManagementProps {
  cases: CaseSummary[];
  onOpenCase: (caseId: string) => void;
}

export const CaseManagement: React.FC<CaseManagementProps> = ({ cases, onOpenCase }) => {
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('all');

  const filtered = cases.filter((c) => {
    if (verdictFilter !== 'all' && c.verdict !== verdictFilter) return false;
    if (!search) return true;
    return (
      c.case_id.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_id.toLowerCase().includes(search.toLowerCase()) ||
      c.card_id.toLowerCase().includes(search.toLowerCase()) ||
      c.pattern.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Exam Case Repository & Memory Store
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            20 November–December benchmark cases evaluated by the LangGraph agent and stored into TigerGraph's closed case memory.
          </p>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search case ID, pattern, card..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px 5px 28px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            style={{
              background: 'var(--bg-card-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 8px',
              fontSize: '11px',
              outline: 'none',
            }}
          >
            <option value="all">All Verdicts</option>
            <option value="fraud">Fraud Only</option>
            <option value="legitimate">Legitimate Only</option>
          </select>
        </div>
      </div>

      {/* Grid of Case Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
        {filtered.map((c) => (
          <div
            key={c.case_id}
            className="card card-elevated"
            onClick={() => onOpenCase(c.case_id)}
            style={{
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderTop: c.verdict === 'fraud' ? '3px solid var(--risk-high)' : '3px solid var(--risk-low)',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-tiger)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {c.case_id}
              </span>
              {c.verdict === 'fraud' ? (
                <span className="badge badge-fraud">{Math.round(c.fraud_probability * 100)}% FRAUD</span>
              ) : (
                <span className="badge badge-legitimate">CLEARED LEGITIMATE</span>
              )}
            </div>

            {/* Pattern & Exposure */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Pattern: <strong style={{ color: 'var(--text-primary)' }}>{c.pattern.replace(/_/g, ' ')}</strong>
              </span>
              <span className="mono" style={{ fontWeight: 700, color: c.exposure_usd > 0 ? 'var(--risk-high)' : 'var(--text-muted)' }}>
                ${c.exposure_usd.toFixed(2)}
              </span>
            </div>

            {/* Trigger text */}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {c.trigger_text}
            </p>

            {/* Bottom Meta */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
              <span className="mono" style={{ color: 'var(--text-muted)' }}>
                Cust: {c.customer_id}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {c.sar_filed && (
                  <span className="badge badge-l2" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    SAR FILED
                  </span>
                )}
                <span style={{ color: 'var(--brand-tiger)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                  Inspect <ArrowRight size={10} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
