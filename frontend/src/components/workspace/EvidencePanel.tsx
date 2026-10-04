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
        return <Network size={13} color="#4f63d2" />;
      case 'customer':
        return <MessageSquare size={13} color="#059669" />;
      case 'document':
        return <FileText size={13} color="#7c5cd6" />;
      case 'model':
        return <AlertCircle size={13} color="#d9820b" />;
      default:
        return <FileText size={13} color="#6b7388" />;
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
        background: '#ffffff',
        border: '1px solid rgba(71, 85, 140, 0.117)',
        boxShadow: 'none',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px 16px',
        flexShrink: 0,
      }}
    >
      {/* Header with Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(71, 85, 140, 0.091)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} color="#4f63d2" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1f2638' }}>
            Evidence Dossier ({evidenceList.length})
          </span>
        </div>

        {/* Tab Filters with Smooth Sliding Indicator */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            background: '#f6f7fa',
            border: '1px solid rgba(71, 85, 140, 0.078)',
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
                  color: isActive ? '#1f2638' : '#6b7388',
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
                      background: 'rgba(71, 85, 140, 0.13)',
                      border: '1px solid rgba(79, 99, 210, 0.3)',
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
              borderRadius: '6px',
              background: '#f6f7fa',
              border: '1px solid rgba(71, 85, 140, 0.078)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: 'none',
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
                    color: '#4f63d2',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  SOURCE: {item.source.toUpperCase()}
                </span>
              </div>
              <span className="mono" style={{ fontSize: '10px', color: '#6b7388' }}>
                {item.ref}
              </span>
            </div>

            {/* Claim Text */}
            <p style={{ fontSize: '11.5px', color: '#1f2638', lineHeight: 1.45, margin: 0 }}>
              {item.claim}
            </p>

            {/* Supporting Entity IDs */}
            {item.entity_ids && item.entity_ids.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ fontSize: '10px', color: '#6b7388' }}>Entities:</span>
                {item.entity_ids.map((id, i) => (
                  <span
                    key={i}
                    className="mono"
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(79, 99, 210, 0.1)',
                      border: '1px solid rgba(79, 99, 210, 0.3)',
                      color: '#4f63d2',
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
              borderRadius: '6px',
              background: 'rgba(5, 150, 105, 0.06)',
              border: '1px solid rgba(5, 150, 105, 0.3)',
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={12} /> ADDITIONAL EVIDENCE SIMULATION
              </span>
              <span className="mono" style={{ fontSize: '10px', color: '#6b7388' }}>
                Step #{caseData.evidence_requests[0].asked_after_step}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#556078' }}>
              Type: <strong style={{ color: '#1f2638' }}>{caseData.evidence_requests[0].type.replace('_', ' ')}</strong>
            </div>
            <p style={{ fontSize: '11.5px', color: '#1f2638', fontStyle: 'italic', background: '#f6f7fa', padding: '6px 8px', borderRadius: '4px', margin: 0 }}>
              "{caseData.evidence_requests[0].assumed_response}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

