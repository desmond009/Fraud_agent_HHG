import React, { useState } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  Download,
  Shield,
  Building,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';
import { SARPayload } from '../../types';

interface SARDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  sar: SARPayload;
}

export const SARDrawer: React.FC<SARDrawerProps> = ({ isOpen, onClose, caseId, sar }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sar.narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sar, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SAR_${caseId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '560px',
          maxWidth: '90vw',
          background: 'var(--bg-card-elevated)',
          borderLeft: '1px solid var(--border-default)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-drawer)',
          animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-topbar)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'var(--route-l2-bg)',
                border: '1px solid var(--route-l2-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={16} color="var(--route-l2)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                FinCEN Suspicious Activity Report (SAR)
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Docket Ref: SAR-{caseId} • Regulatory Filing
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                TOTAL SUSPICIOUS AMOUNT
              </div>
              <div className="mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--risk-high)', marginTop: '2px' }}>
                ${sar.total_amount_usd.toFixed(2)} USD
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                ACTIVITY DATE WINDOW
              </div>
              <div className="mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {sar.activity_dates?.[0] || '2016-12-08'} to {sar.activity_dates?.[1] || '2016-12-08'}
              </div>
            </div>
          </div>

          {/* Filing Justification */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-secondary)' }}>
              REGULATORY FILING JUSTIFICATION
            </span>
            <div
              style={{
                marginTop: '6px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
            >
              {sar.reason}
            </div>
          </div>

          {/* Named Subjects */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-secondary)' }}>
              NAMED SUSPECTS & LINKED ENTITIES ({sar.subjects?.length || 0})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {(sar.subjects || []).map((sub, i) => (
                <span
                  key={i}
                  className="mono"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tag)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--brand-tiger)',
                  }}
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {/* Official Narrative */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-secondary)' }}>
                STANDALONE SAR NARRATIVE
              </span>
              <button
                onClick={handleCopy}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copied ? <Check size={11} color="var(--risk-low)" /> : <Copy size={11} />}
                <span>{copied ? 'Copied!' : 'Copy Narrative'}</span>
              </button>
            </div>

            <div
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                fontSize: '12px',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                fontFamily: 'Georgia, serif',
                whiteSpace: 'pre-wrap',
              }}
            >
              {sar.narrative}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-topbar)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Complies with FinCEN Narrative Guidance & Rule R2/R6
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleDownload} className="btn btn-secondary btn-sm">
              <Download size={12} />
              <span>Export SAR JSON</span>
            </button>
            <button onClick={onClose} className="btn btn-primary btn-sm">
              <span>Close Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
