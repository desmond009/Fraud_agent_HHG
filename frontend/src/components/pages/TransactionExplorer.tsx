import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  CreditCard,
  User,
  ShieldAlert,
} from 'lucide-react';
import { TransactionItem } from '../../types';
import { fetchTransactions } from '../../api/client';

interface TransactionExplorerProps {
  onInvestigateCase: (caseId: string) => void;
}

export const TransactionExplorer: React.FC<TransactionExplorerProps> = ({ onInvestigateCase }) => {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [minRisk, setMinRisk] = useState<number>(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTxns();
  }, [channelFilter, minRisk]);

  const loadTxns = async () => {
    setLoading(true);
    try {
      const res = await fetchTransactions({
        limit: 50,
        channel: channelFilter !== 'all' ? channelFilter : undefined,
        min_risk: minRisk > 0 ? minRisk : undefined,
      });
      setItems(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter((t) => {
    if (!search) return true;
    return (
      t.txn_id.includes(search) ||
      t.card_id.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_id.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Transaction Explorer & Risk Signals
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            590,742 total transactions loaded in TigerGraph. Displaying real-time model scored alerts and high-risk authorisations.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '200px' }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search txn ID, card..."
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
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
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
            <option value="all">All Channels</option>
            <option value="online">Online Only</option>
            <option value="in_person">In-Person Only</option>
          </select>

          <select
            value={minRisk}
            onChange={(e) => setMinRisk(Number(e.target.value))}
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
            <option value="0">All Risk Scores</option>
            <option value="0.5">Risk &gt; 0.50</option>
            <option value="0.7">Risk &gt; 0.70</option>
            <option value="0.85">Critical (&gt; 0.85)</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-topbar)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>TXN ID</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>TIMESTAMP</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>CUSTOMER / CARD</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>AMOUNT</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>CHANNEL</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>MODEL RISK SCORE</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'center' }}>INVESTIGATE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const riskPct = Math.round(t.risk_score * 100);
              return (
                <tr
                  key={t.txn_id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-tiger)' }}>
                      #{t.txn_id}
                    </span>
                  </td>

                  <td style={{ padding: '10px 14px' }}>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {t.timestamp}
                    </span>
                  </td>

                  <td style={{ padding: '10px 14px' }}>
                    <div className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {t.customer_id}
                    </div>
                    <div className="mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {t.card_id}
                    </div>
                  </td>

                  <td style={{ padding: '10px 14px' }}>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      ${t.amount.toFixed(2)}
                    </span>
                  </td>

                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: t.channel === 'online' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                        color: t.channel === 'online' ? 'var(--brand-tiger)' : 'var(--text-secondary)',
                      }}
                    >
                      {t.channel}
                    </span>
                  </td>

                  {/* Risk Score Progress Bar */}
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: riskPct > 75 ? 'var(--risk-high)' : riskPct > 50 ? 'var(--risk-medium)' : 'var(--risk-low)',
                          width: '32px',
                        }}
                      >
                        {t.risk_score.toFixed(2)}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: '5px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--border-default)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${riskPct}%`,
                            height: '100%',
                            background: riskPct > 75 ? 'var(--risk-high)' : riskPct > 50 ? 'var(--risk-medium)' : 'var(--risk-low)',
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onInvestigateCase(t.case_id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Case {t.case_id}</span>
                      <ArrowRight size={11} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
