import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  CircleDashed,
  Terminal,
  Database,
  Search,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { CaseDetail } from '../../types';

interface AgentActivityFeedProps {
  caseData: CaseDetail;
  isRunning?: boolean;
}

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({ caseData, isRunning }) => {
  const c = caseData.case;
  const trigger = caseData.trigger;

  const pipelineStages = [
    {
      id: 'ingestion',
      name: 'Trigger Ingestion',
      desc: `Ingested ${trigger?.trigger_type || 'risk_score'} alert for card ${trigger?.card_id}`,
      status: 'completed',
    },
    {
      id: 'investigation',
      name: 'TigerGraph Traversal',
      desc: 'Queried 24h txn velocity window & device neighborhood via MCP bridge',
      status: 'completed',
    },
    {
      id: 'synthesis',
      name: 'Evidence Synthesis',
      desc: `Matched typology (${c.pattern}) & retrieved 3 GraphRAG rules from ChromaDB`,
      status: 'completed',
    },
    {
      id: 'uncertainty',
      name: 'Uncertainty Assessment',
      desc: `Initial fraud probability calibrated; evaluated Rule R1 weak signal guardrail`,
      status: 'completed',
    },
    {
      id: 'simulation',
      name: 'Evidence Simulation & NBA',
      desc: `Assessed customer response; formulated final actions and FinCEN SAR narrative`,
      status: 'completed',
    },
    {
      id: 'writeback',
      name: 'Case Memory Writeback',
      desc: `Upserted ${c.graph_case_id || 'ClosedCase'} vertex & edges to TigerGraph`,
      status: 'completed',
    },
  ];

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: '14px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              background: 'var(--brand-tiger-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={12} color="var(--brand-tiger)" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            AI INVESTIGATOR REASONING
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isRunning ? (
            <span className="badge badge-uncertain badge-pill" style={{ fontSize: '10px' }}>
              <CircleDashed size={10} className="spin" /> Deliberating
            </span>
          ) : (
            <span className="badge badge-legitimate badge-pill" style={{ fontSize: '10px' }}>
              <CheckCircle2 size={10} /> Finished (6/6)
            </span>
          )}
        </div>
      </div>

      {/* Stage Progression Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {pipelineStages.map((stage, idx) => (
          <div
            key={stage.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ marginTop: '2px' }}>
              <CheckCircle2 size={13} color="var(--brand-tiger)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {idx + 1}. {stage.name}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  DONE
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                {stage.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Structured Agent Findings Box */}
      <div
        style={{
          marginTop: 'auto',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Terminal size={12} color="var(--brand-tiger)" />
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            CURRENT DELIBERATION SUMMARY
          </span>
        </div>
        <p style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {caseData.case.summary}
        </p>

        {caseData.stop_reason && (
          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Termination Rationale: </span>
            {caseData.stop_reason}
          </div>
        )}
      </div>
    </div>
  );
};
