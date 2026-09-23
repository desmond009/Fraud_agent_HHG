import React, { useState } from 'react';
import {
  ShieldAlert,
  BookOpen,
  Scale,
  FileText,
  Search,
  CheckCircle,
} from 'lucide-react';
import { PolicyRule } from '../../types';

interface PoliciesViewProps {
  policies: PolicyRule[];
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({ policies }) => {
  const [filter, setFilter] = useState<'all' | 'rule' | 'pattern' | 'regulatory'>('all');
  const [search, setSearch] = useState('');

  const filtered = policies.filter((p) => {
    if (filter !== 'all' && p.category !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.content.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Fraud Policy & Regulatory Standard (v1.0)
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Operational rules R1 through R10, FinCEN SAR narrative directives, and approval routing hierarchies governing agent actions.
          </p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search policies or rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              width: '240px',
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-default)', paddingBottom: '10px' }}>
        {(['all', 'rule', 'pattern', 'regulatory'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              fontSize: '11px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: filter === tab ? 'var(--brand-tiger)' : 'var(--border-default)',
              background: filter === tab ? 'var(--bg-card-elevated)' : 'transparent',
              color: filter === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {tab === 'rule' ? 'Rules (R1-R10)' : tab === 'pattern' ? 'Known Typologies' : tab === 'regulatory' ? 'FinCEN Standards' : 'All Policies'}
          </button>
        ))}
      </div>

      {/* Policy Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            className="card card-elevated"
            style={{
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderTop: item.category === 'rule' ? '3px solid var(--brand-tiger)' : item.category === 'pattern' ? '3px solid var(--risk-medium)' : '3px solid var(--route-l2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-tiger)' }}>
                {item.rule_id}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tag)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ROUTE: {item.approval_route}
              </span>
            </div>

            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {item.title}
            </h3>

            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
