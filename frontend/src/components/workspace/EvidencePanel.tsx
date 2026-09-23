import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Network,
  CreditCard,
  Smartphone,
  History,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { CaseDetail, EvidenceItem } from '../../types';

interface EvidencePanelProps {
  caseData: CaseDetail;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ caseData }) => {
  const c = caseData.case;
  const trigger = caseData.trigger;
  const [activeTab, setActiveTab] = useState<'all' | 'graph' | 'policy' | 'customer'>('all');

  const evidenceList: EvidenceItem[] = c.evidence || [];

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'graph':
        return <Network size={13} color="#38bdf8" />;
      case 'customer':
        return <MessageSquare size={13} color="#10b981" />;
      case 'document':
        return <FileText size={13} color="#a855f7" />;
      case 'model':
        return <AlertCircle size={13} color="#f59e0b" />;
      default:
        return <FileText size={13} color="#71717a" />;
    }
  };

  const filteredEvidence = evidenceList.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'graph') return item.source === 'graph';
    if (activeTab === 'customer') return item.source === 'customer';
    if (activeTab === 'policy') return item.source === 'document' || item.ref.includes('rule');
    return true;
  });

  return (
    <div
      style={{
        background: 'radial-gradient(ellipse at 15% 0%, rgba(14, 165, 233, 0.05), transparent 70%), rgba(20, 20, 26, 0.78)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07), 0 4px 20px rgba(0, 0, 0, 0.45)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px 16px',
        flexShrink: 0,
      }}
    >
      {/* Header with Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.07)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} color="#38bdf8" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f4f4f5' }}>
            Evidence Dossier ({evidenceList.length})
          </span>
        </div>

        {/* Tab Filters with Smooth Sliding Indicator */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '6px',
            padding: '2px',
          }}
        >
          {(['all', 'graph', 'customer'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  position: 'relative',
                  fontSize: '10px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#f4f4f5' : '#71717a',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  zIndex: 2,
                  transition: 'color 0.15s ease',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="evidenceTabHighlight"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      zIndex: -1,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Evidence Items Scroll Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
        {filteredEvidence.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ x: 2 }}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Source & Ref Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {getSourceIcon(item.source)}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#38bdf8',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  SOURCE: {item.source.toUpperCase()}
                </span>
              </div>
              <span className="mono" style={{ fontSize: '10px', color: '#71717a' }}>
                {item.ref}
              </span>
            </div>

            {/* Claim Text */}
            <p style={{ fontSize: '11.5px', color: '#f4f4f5', lineHeight: 1.45, margin: 0 }}>
              {item.claim}
            </p>

            {/* Supporting Entity IDs */}
            {item.entity_ids && item.entity_ids.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ fontSize: '10px', color: '#71717a' }}>Entities:</span>
                {item.entity_ids.map((id, i) => (
                  <span
                    key={i}
                    className="mono"
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontWeight: 600,
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}

        {/* Customer Validation / Additional Evidence Request Simulation Card */}
        {caseData.evidence_requests && caseData.evidence_requests.length > 0 && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={12} /> ADDITIONAL EVIDENCE SIMULATION
              </span>
              <span className="mono" style={{ fontSize: '10px', color: '#71717a' }}>
                Step #{caseData.evidence_requests[0].asked_after_step}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
              Type: <strong style={{ color: '#f4f4f5' }}>{caseData.evidence_requests[0].type.replace('_', ' ')}</strong>
            </div>
            <p style={{ fontSize: '11.5px', color: '#f4f4f5', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px', margin: 0 }}>
              "{caseData.evidence_requests[0].assumed_response}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

