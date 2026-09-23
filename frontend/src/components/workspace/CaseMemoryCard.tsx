import React from 'react';
import {
  History,
  Archive,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { CaseDetail } from '../../types';

interface CaseMemoryCardProps {
  caseData: CaseDetail;
}

export const CaseMemoryCard: React.FC<CaseMemoryCardProps> = ({ caseData }) => {
  const similarPriorCases = caseData.case?.similar_prior_cases || [];
  const pattern = caseData.case?.pattern || 'none';

  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'var(--bg-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <History size={14} color="var(--route-l2)" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            HISTORICAL CASE MEMORY ({similarPriorCases.length})
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          TigerGraph GSQL Matcher
        </span>
      </div>

      {similarPriorCases.length === 0 ? (
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
          No direct historical closed cases matched for this pattern.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
          {similarPriorCases.map((caseId, idx) => (
            <div
              key={idx}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--route-l2)' }}>
                  {caseId}
                </span>
                <span className="badge badge-fraud" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  CONFIRMED FRAUD
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Typology: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pattern.replace('_', ' ')}</span>
              </div>

              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: '2px' }}>
                Resolved with card block and protective entity clustering. Informed current recommendation.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
