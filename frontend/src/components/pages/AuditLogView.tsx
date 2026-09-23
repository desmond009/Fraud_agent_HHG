import React, { useState, useEffect } from 'react';
import {
  FileClock,
  User,
  Bot,
  Cpu,
  Shield,
  CheckCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { AuditEvent } from '../../types';
import { fetchAuditLog } from '../../api/client';

export const AuditLogView: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLog(100);
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getActorIcon = (actorType: string) => {
    if (actorType === 'analyst') return <User size={13} color="var(--risk-low)" />;
    if (actorType === 'agent') return <Bot size={13} color="var(--brand-tiger)" />;
    return <Cpu size={13} color="var(--text-muted)" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Investigation Audit & Action Log
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Immutable chronological record of AI agent deliberations, TigerGraph query invocations, and analyst human sign-offs.
          </p>
        </div>

        <button onClick={loadEvents} className="btn btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-topbar)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>EVENT ID</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>TIMESTAMP</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>CASE REF</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>ACTOR</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>ACTION / OPERATION</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>DETAILS & AUDIT NOTES</th>
            </tr>
          </thead>
          <tbody>
            {events.map((evt) => (
              <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {evt.id}
                  </span>
                </td>

                <td style={{ padding: '10px 14px' }}>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {evt.timestamp ? evt.timestamp.replace('T', ' ').slice(0, 19) : ''}
                  </span>
                </td>

                <td style={{ padding: '10px 14px' }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-tiger)' }}>
                    {evt.case_id}
                  </span>
                </td>

                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getActorIcon(evt.actor_type)}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{evt.actor}</span>
                  </div>
                </td>

                <td style={{ padding: '10px 14px' }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-tag)',
                      color: evt.action.includes('APPROVE') ? 'var(--risk-low)' : 'var(--text-primary)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    {evt.action}
                  </span>
                </td>

                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                  {evt.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
