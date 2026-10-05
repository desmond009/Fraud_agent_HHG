import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  CircleDashed,
  Terminal,
  ChevronDown,
  ChevronRight,
  Database,
  Search,
  ShieldAlert,
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
  const [expandedStep, setExpandedStep] = useState<number | null>(1); // Default expand GSQL traversal

  const toggleStep = (idx: number) => {
    setExpandedStep(expandedStep === idx ? null : idx);
  };

  const pipelineStages = [
    {
      id: 'trigger',
      stepNum: 1,
      name: 'Trigger Ingestion & Alert Verification',
      badge: 'ALERT STREAM',
      desc: `Ingested ${trigger?.trigger_type || 'risk_score'} alert for card ${trigger?.card_id || 'CARD-4111'}. Flagged transaction #${trigger?.flagged_txn_id}.`,
      latency: '12ms',
      dotColor: '#4f63d2',
      dotGlow: 'rgba(79, 99, 210, 0.5)',
      detail: `Trigger criteria: Risk score ${trigger?.risk_score ?? 89}/100. Stream payload decoded into investigation context.`,
    },
    {
      id: 'traversal',
      stepNum: 2,
      name: 'Graph Traversal via GSQL (TigerGraph)',
      badge: 'GSQL QUERY',
      desc: 'Executed 2-hop k-step neighbor traversal via TigerGraph REST++ / MCP connector.',
      latency: '34ms',
      dotColor: '#059669',
      dotGlow: 'rgba(5, 150, 105, 0.6)',
      pulse: true,
      detail: `Traversed: ${c.connected_card_ids?.length || 1} Cards, ${c.connected_device_profiles?.length || 1} Devices, ${c.affected_txn_ids?.length || 1} Transactions. Found device link to prior cases.`,
    },
    {
      id: 'evidence',
      stepNum: 3,
      name: 'Evidence & Anomaly Extraction',
      badge: 'SYNTHESIS',
      desc: `Matched typology [${c.pattern}] & retrieved ${caseData.case.evidence?.length || 3} verified evidence claims from graph store.`,
      latency: '58ms',
      dotColor: '#7c5cd6',
      dotGlow: 'rgba(124, 92, 214, 0.5)',
      detail: `Telemetry highlights: IP Geolocation vs customer residence anomaly, card-not-present authorization attempt.`,
    },
    {
      id: 'uncertainty',
      stepNum: 4,
      name: 'Uncertainty Assessment & Entropy Gate',
      badge: 'ENTROPY',
      desc: `Evaluated confidence entropy. Triggered step-up validation check; initial probability calibrated at ${Math.round((c.fraud_probability || 0.8) * 100)}%.`,
      latency: '110ms',
      dotColor: '#d9820b',
      dotGlow: 'rgba(217, 130, 11, 0.5)',
      detail: `Weak-signal guardrails applied. Step-up auth evaluated for customer friction threshold.`,
    },
    {
      id: 'action',
      stepNum: 5,
      name: 'Action Formulation & Policy Mapping',
      badge: 'POLICY ENGINE',
      desc: `Synthesized next-best actions under routing policies. Recommended permanent block and regulatory filing.`,
      latency: '26ms',
      dotColor: '#dc3c45',
      dotGlow: 'rgba(220, 60, 69, 0.5)',
      detail: `Action payload: BLOCK_CARD (L2 route) + FILE_SAR (FinCEN Part V). Approved by policy engine.`,
    },
    {
      id: 'memory',
      stepNum: 6,
      name: 'Memory Vector Update (Graph Writeback)',
      badge: 'UPSERT',
      desc: `Upserted case vertex ${c.graph_case_id || `CASE-${caseData.case_id}`} into TigerGraph vector memory.`,
      latency: '18ms',
      dotColor: '#059669',
      dotGlow: 'rgba(5, 150, 105, 0.5)',
      detail: `Cosine similarity vector embedded for rapid retrieval by subsequent agent investigations.`,
    },
  ];

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(71, 85, 140, 0.117)',
        boxShadow: 'none',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: '14px 16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'rgba(79, 99, 210, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none',
            }}
          >
            <Sparkles size={13} color="#4f63d2" />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#1f2638' }}>
              Live Agent Execution Pipeline
            </div>
            <div style={{ fontSize: '10px', color: '#6b7388' }}>
              Autonomous 6-Node LangGraph Loop
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
                padding: '3px 9px',
                borderRadius: '9999px',
                background: 'rgba(217, 130, 11, 0.15)',
                color: '#d9820b',
                border: '1px solid rgba(217, 130, 11, 0.35)',
                fontSize: '10.5px',
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
                gap: '5px',
                padding: '3px 9px',
                borderRadius: '9999px',
                background: 'rgba(5, 150, 105, 0.15)',
                color: '#059669',
                border: '1px solid rgba(5, 150, 105, 0.35)',
                fontSize: '10.5px',
                fontWeight: 600,
                boxShadow: 'none',
              }}
            >
              <CheckCircle2 size={11} /> 6/6 Nodes Executed
            </span>
          )}
        </div>
      </div>

      {/* Vertical Pipeline Timeline */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          flex: 1,
          paddingRight: '4px',
        }}
      >
        {/* Continuous Vertical Guide Line */}
        <div
          style={{
            position: 'absolute',
            left: '11px',
            top: '12px',
            bottom: '24px',
            width: '2px',
            background: 'linear-gradient(180deg, #4f63d2 0%, #059669 30%, #7c5cd6 60%, #d9820b 80%, #059669 100%)',
            opacity: 0.35,
            zIndex: 1,
          }}
        />

        {pipelineStages.map((stage, idx) => {
          const isExpanded = expandedStep === idx;
          return (
            <motion.div
              key={stage.id}
              whileHover={{ x: 2 }}
              onClick={() => toggleStep(idx)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '8px 10px 8px 0',
                cursor: 'pointer',
                borderRadius: '6px',
                background: isExpanded ? 'rgba(71, 85, 140, 0.046)' : 'transparent',
                transition: 'background 0.15s ease',
                zIndex: 2,
              }}
            >
              {/* Glowing Pipeline Node Dot */}
              <div
                style={{
                  width: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                  position: 'relative',
                }}
              >
                {isExpanded && (
                  <motion.div
                    animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    style={{
                      position: 'absolute',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      border: `2px solid ${stage.dotColor}`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
                <div
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: stage.dotColor,
                    boxShadow: 'none',
                    border: '1.5px solid #ffffff',
                    animation: stage.pulse ? 'pulse-ring 2s infinite' : 'none',
                    position: 'relative',
                    zIndex: 1,
                  }}
                />
              </div>

              {/* Step Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: isExpanded ? '#4f63d2' : '#1f2638' }}>
                      {stage.stepNum}. {stage.name}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'rgba(71, 85, 140, 0.078)',
                        color: '#556078',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {stage.badge}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#556078',
                        background: 'rgba(71, 85, 140, 0.065)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(71, 85, 140, 0.078)',
                      }}
                    >
                      {stage.latency}
                    </span>
                    {isExpanded ? <ChevronDown size={12} color="#6b7388" /> : <ChevronRight size={12} color="#6b7388" />}
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#556078', marginTop: '3px', lineHeight: 1.4 }}>
                  {stage.desc}
                </div>

                {/* Animated Accordion Telemetry Expansion */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="telemetry"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '8px 11px',
                          background: '#f6f7fa',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          color: '#3a445b',
                          borderLeft: `3px solid ${stage.dotColor}`,
                          border: '1px solid rgba(71, 85, 140, 0.078)',
                          lineHeight: 1.45,
                          boxShadow: 'none',
                        }}
                      >
                        <span style={{ color: '#4f63d2', fontWeight: 700 }}>GSQL / LLM Telemetry: </span>
                        <span>{stage.detail}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Deliberation Summary Footnote */}
      <div
        style={{
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: '6px',
          background: '#f6f7fa',
          border: '1px solid rgba(71, 85, 140, 0.091)',
          boxShadow: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <Terminal size={11} color="#4f63d2" />
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7388' }}>
            Agent Rationale Summary
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#1f2638', lineHeight: 1.45, margin: 0 }}>
          {caseData.case.summary}
        </p>
      </div>
    </div>
  );
};

