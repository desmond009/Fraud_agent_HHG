import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  CircleDashed,
  Terminal,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { CaseDetail } from '../../types';

interface AgentActivityFeedProps {
  caseData: CaseDetail;
  isRunning?: boolean;
}

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({ caseData, isRunning }) => {
  const c = caseData.case;
  const trigger = caseData.trigger;
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleStep = (idx: number) => {
    setExpandedStep(expandedStep === idx ? null : idx);
  };

  const pipelineStages = [
    {
      id: 'trigger',
      name: 'Trigger Ingestion & Alert Verification',
      desc: `Ingested ${trigger?.trigger_type || 'risk_score'} alert for card ${trigger?.card_id || 'CARD-4111'}. Flagged transaction #${trigger?.flagged_txn_id}.`,
      latency: '12ms',
      detail: `Trigger criteria: Risk score ${trigger?.risk_score ?? 89}/100. Alert payload decoded from real-time stream.`,
    },
    {
      id: 'traversal',
      name: 'Graph Traversal (TigerGraph GSQL)',
      desc: 'Executed 2-hop k-step neighbor traversal via TigerGraph REST++ / MCP connector.',
      latency: '34ms',
      detail: `Traversed: ${c.connected_card_ids?.length || 1} Cards, ${c.connected_device_profiles?.length || 1} Devices, ${c.affected_txn_ids?.length || 1} Transactions. Found device link to prior cases.`,
    },
    {
      id: 'evidence',
      name: 'Evidence & Anomaly Extraction',
      desc: `Matched typology [${c.pattern}] & retrieved ${caseData.case.evidence?.length || 3} verified evidence claims from graph store.`,
      latency: '58ms',
      detail: `Telemetry highlights: IP Geolocation vs customer residence anomaly, card-not-present authorization attempt.`,
    },
    {
      id: 'uncertainty',
      name: 'Uncertainty Assessment & Entropy Gate',
      desc: `Evaluated confidence entropy. Triggered step-up validation check; initial probability calibrated at ${Math.round((c.fraud_probability || 0.8) * 100)}%.`,
      latency: '110ms',
      detail: `Weak-signal guardrails applied. Step-up auth evaluated for customer friction threshold.`,
    },
    {
      id: 'action',
      name: 'Action Formulation & Policy Mapping',
      desc: `Synthesized next-best actions under routing policies. Recommended permanent block and regulatory filing.`,
      latency: '26ms',
      detail: `Action payload: BLOCK_CARD (L2 route) + FILE_SAR (FinCEN Part V). Approved by policy engine.`,
    },
    {
      id: 'memory',
      name: 'Memory Vector Update (Graph Writeback)',
      desc: `Upserted case vertex ${c.graph_case_id || `CASE-${caseData.case_id}`} into TigerGraph vector memory.`,
      latency: '18ms',
      detail: `Cosine similarity vector embedded for rapid retrieval by subsequent agent investigations.`,
    },
  ];

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: '14px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(14, 165, 233, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={13} color="var(--brand-tiger-hover)" />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              Live Agent Reasoning Trace
            </span>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              6-Stage Autonomous Loop Cycle
            </div>
          </div>
        </div>

        <div>
          {isRunning ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--risk-medium)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              <CircleDashed size={11} className="spin" /> Deliberating
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--risk-low)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={11} /> 6/6 Complete
            </span>
          )}
        </div>
      </div>

      {/* Stage Progression Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
        {pipelineStages.map((stage, idx) => {
          const isExpanded = expandedStep === idx;
          return (
            <div
              key={stage.id}
              onClick={() => toggleStep(idx)}
              style={{
                borderRadius: 'var(--radius-sm)',
                background: isExpanded ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                border: isExpanded ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                padding: '8px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={13} color="var(--brand-tiger-hover)" />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {idx + 1}. {stage.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="mono" style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                    {stage.latency}
                  </span>
                  {isExpanded ? <ChevronDown size={12} color="var(--text-muted)" /> : <ChevronRight size={12} color="var(--text-muted)" />}
                </div>
              </div>

              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.35, paddingLeft: '21px' }}>
                {stage.desc}
              </div>

              {isExpanded && (
                <div
                  style={{
                    marginTop: '6px',
                    marginLeft: '21px',
                    padding: '6px 8px',
                    background: 'var(--bg-tag)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    borderLeft: '2px solid var(--brand-tiger)',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Telemetry Output: </span>
                  {stage.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Deliberation Summary Footnote */}
      <div
        style={{
          marginTop: '10px',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <Terminal size={11} color="var(--brand-tiger)" />
          <span style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Agent Rationale Summary
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.35 }}>
          {caseData.case.summary}
        </p>
      </div>
    </div>
  );
};
