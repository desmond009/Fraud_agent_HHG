import React from 'react';
import {
  Clock,
  CheckCircle2,
  CircleAlert,
  ArrowRight,
  Database,
  FileCheck,
} from 'lucide-react';
import { CaseDetail } from '../../types';

interface InvestigationTimelineProps {
  caseData: CaseDetail;
}

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({ caseData }) => {
  const c = caseData.case;
  const trigger = caseData.trigger;
  const baseTime = trigger?.opened_at ? trigger.opened_at.split(' ')[1] : '03:38:37';

  const events = [
    {
      time: baseTime,
      title: 'Fraud Signal Received',
      desc: `Triggered by ${trigger?.trigger_type.replace('_', ' ')} on flagged transaction #${trigger?.flagged_txn_id || '3523199'}`,
      badge: 'TRIGGER',
      badgeColor: 'amber',
    },
    {
      time: '+0.1s',
      title: 'Investigation Initialized',
      desc: 'LangGraph StateGraph initialized with customer profile and card metadata',
      badge: 'AGENT',
      badgeColor: 'blue',
    },
    {
      time: '+0.3s',
      title: 'TigerGraph Traversal (MCP)',
      desc: 'Executed txn_window (24h) and device_region_neighborhood queries',
      badge: 'GRAPH',
      badgeColor: 'blue',
    },
    {
      time: '+0.6s',
      title: 'Graph Anomaly Discovered',
      desc: c.evidence?.[0]?.claim || 'Suspicious velocity cluster and linked cross-card entities detected',
      badge: 'EVIDENCE',
      badgeColor: 'red',
    },
    {
      time: '+0.9s',
      title: 'GraphRAG Policy Retrieval',
      desc: 'Retrieved Fraud Policy rules (R1, R2, R6) and FinCEN SAR guidance from ChromaDB',
      badge: 'RAG',
      badgeColor: 'purple',
    },
    {
      time: '+1.2s',
      title: 'Additional Evidence Evaluated',
      desc: caseData.evidence_requests?.[0]?.assumed_response || 'Customer verification settled unauthorized use question',
      badge: 'SIMULATION',
      badgeColor: 'green',
    },
    {
      time: '+1.5s',
      title: 'Next Best Action Formulated',
      desc: `Recommended ${caseData.next_best_actions?.final?.[0]?.action || 'BLOCK_CARD'} with routing and FinCEN SAR evaluation`,
      badge: 'NBA',
      badgeColor: 'amber',
    },
    {
      time: `+${caseData.latency_s || '1.61'}s`,
      title: 'Case Written Back to TigerGraph',
      desc: `Case vertex ${c.graph_case_id || 'CASE-HHG-005'} and edges upserted into FraudGraph memory`,
      badge: 'WRITEBACK',
      badgeColor: 'green',
    },
  ];

  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--bg-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Clock size={14} color="var(--brand-tiger)" />
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
          CHRONOLOGICAL INVESTIGATION TIMELINE
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
        {/* Continuous timeline vertical line */}
        <div
          style={{
            position: 'absolute',
            left: '38px',
            top: '8px',
            bottom: '8px',
            width: '2px',
            background: 'var(--border-default)',
            zIndex: 1,
          }}
        />

        {events.map((evt, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', position: 'relative', zIndex: 2 }}>
            <span
              className="mono"
              style={{
                width: '44px',
                fontSize: '10px',
                color: 'var(--text-muted)',
                textAlign: 'right',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              {evt.time}
            </span>

            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background:
                  evt.badgeColor === 'red'
                    ? 'var(--risk-high)'
                    : evt.badgeColor === 'green'
                    ? 'var(--risk-low)'
                    : evt.badgeColor === 'amber'
                    ? 'var(--risk-medium)'
                    : 'var(--brand-tiger)',
                border: '2px solid #070a11',
                marginTop: '4px',
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {evt.title}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tag)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {evt.badge}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                {evt.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
