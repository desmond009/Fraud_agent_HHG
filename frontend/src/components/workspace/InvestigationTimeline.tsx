import React from 'react';
import { motion } from 'framer-motion';
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
      dotColor: '#f59e0b',
    },
    {
      time: '+0.1s',
      title: 'Investigation Initialized',
      desc: 'LangGraph StateGraph initialized with customer profile and card metadata',
      badge: 'AGENT',
      badgeColor: 'blue',
      dotColor: '#38bdf8',
    },
    {
      time: '+0.3s',
      title: 'TigerGraph Traversal (MCP)',
      desc: 'Executed txn_window (24h) and device_region_neighborhood queries',
      badge: 'GRAPH',
      badgeColor: 'blue',
      dotColor: '#38bdf8',
    },
    {
      time: '+0.6s',
      title: 'Graph Anomaly Discovered',
      desc: c.evidence?.[0]?.claim || 'Suspicious velocity cluster and linked cross-card entities detected',
      badge: 'EVIDENCE',
      badgeColor: 'red',
      dotColor: '#f43f5e',
    },
    {
      time: '+0.9s',
      title: 'GraphRAG Policy Retrieval',
      desc: 'Retrieved Fraud Policy rules (R1, R2, R6) and FinCEN SAR guidance from ChromaDB',
      badge: 'RAG',
      badgeColor: 'purple',
      dotColor: '#a855f7',
    },
    {
      time: '+1.2s',
      title: 'Additional Evidence Evaluated',
      desc: caseData.evidence_requests?.[0]?.assumed_response || 'Customer verification settled unauthorized use question',
      badge: 'SIMULATION',
      badgeColor: 'green',
      dotColor: '#10b981',
    },
    {
      time: '+1.5s',
      title: 'Next Best Action Formulated',
      desc: `Recommended ${caseData.next_best_actions?.final?.[0]?.action || 'BLOCK_CARD'} with routing and FinCEN SAR evaluation`,
      badge: 'NBA',
      badgeColor: 'amber',
      dotColor: '#f59e0b',
    },
    {
      time: `+${caseData.latency_s || '1.61'}s`,
      title: 'Case Written Back to TigerGraph',
      desc: `Case vertex ${c.graph_case_id || 'CASE-HHG-005'} and edges upserted into FraudGraph memory`,
      badge: 'WRITEBACK',
      badgeColor: 'green',
      dotColor: '#10b981',
    },
  ];

  if (caseData.approval?.status === 'approved') {
    const isBlock = caseData.approval.action_name === 'BLOCK_CARD';
    const timeStr = caseData.approval.approved_at
      ? new Date(caseData.approval.approved_at).toLocaleTimeString()
      : 'Live';
    events.push({
      time: timeStr,
      title: isBlock ? 'Card Block Executed' : 'Transaction Cleared & Approved',
      desc: `Action signed off by ${caseData.approval.approved_by || 'Analyst'} (${caseData.approval.analyst_role || 'Analyst Lead'}). Decision permanently committed to audit ledger.`,
      badge: isBlock ? 'BLOCKED' : 'APPROVED',
      badgeColor: isBlock ? 'red' : 'green',
      dotColor: isBlock ? '#f43f5e' : '#10b981',
    });
  }

  return (
    <div
      style={{
        background: 'radial-gradient(ellipse at 15% 0%, rgba(14, 165, 233, 0.05), transparent 70%), rgba(20, 20, 26, 0.78)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07), 0 4px 20px rgba(0, 0, 0, 0.45)',
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Clock size={14} color="#38bdf8" />
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f4f4f5' }}>
          Chronological Investigation Timeline
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
            background: 'linear-gradient(180deg, #f59e0b 0%, #38bdf8 25%, #f43f5e 50%, #a855f7 70%, #10b981 100%)',
            opacity: 0.35,
            zIndex: 1,
          }}
        />

        {events.map((evt, idx) => (
          <motion.div
            key={idx}
            whileHover={{ x: 2 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', position: 'relative', zIndex: 2 }}
          >
            <span
              className="mono"
              style={{
                width: '44px',
                fontSize: '10px',
                color: '#71717a',
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
                background: evt.dotColor,
                boxShadow: `0 0 8px ${evt.dotColor}`,
                border: '2px solid #09090b',
                marginTop: '4px',
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                  {evt.title}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    color: '#a1a1aa',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {evt.badge}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px', lineHeight: 1.35 }}>
                {evt.desc}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

