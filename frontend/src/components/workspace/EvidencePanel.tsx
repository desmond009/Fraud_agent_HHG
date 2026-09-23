import React, { useState } from 'react';
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
        return <Network size={13} color="var(--brand-tiger)" />;
      case 'customer':
        return <MessageSquare size={13} color="var(--risk-low)" />;
      case 'document':
        return <FileText size={13} color="var(--route-l2)" />;
      case 'model':
        return <AlertCircle size={13} color="var(--risk-medium)" />;
      default:
        return <FileText size={13} color="var(--text-muted)" />;
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
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header with Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} color="var(--brand-tiger)" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            EVIDENCE DOSSIER ({evidenceList.length})
          </span>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'graph', 'customer'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: activeTab === tab ? 'var(--brand-tiger)' : 'transparent',
                background: activeTab === tab ? 'var(--bg-card-elevated)' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Items Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredEvidence.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
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
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  SOURCE: {item.source.toUpperCase()}
                </span>
              </div>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {item.ref}
              </span>
            </div>

            {/* Claim Text */}
            <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {item.claim}
            </p>

            {/* Supporting Entity IDs */}
            {item.entity_ids && item.entity_ids.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Entities:</span>
                {item.entity_ids.map((id, i) => (
                  <span
                    key={i}
                    className="mono"
                    style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: 'var(--brand-tiger)',
                      fontWeight: 600,
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Customer Validation / Additional Evidence Request Simulation Card */}
        {caseData.evidence_requests && caseData.evidence_requests.length > 0 && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--risk-low)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={12} /> ADDITIONAL EVIDENCE SIMULATION
              </span>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Step #{caseData.evidence_requests[0].asked_after_step}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Type: <strong style={{ color: 'var(--text-primary)' }}>{caseData.evidence_requests[0].type.replace('_', ' ')}</strong>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-primary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
              "{caseData.evidence_requests[0].assumed_response}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
