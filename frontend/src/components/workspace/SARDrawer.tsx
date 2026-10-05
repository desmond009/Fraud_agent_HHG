import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { fadeSlideInRight, snappyTransition } from '../../utils/motion';

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#f6f7fa',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <motion.div
        variants={fadeSlideInRight}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          width: '560px',
          maxWidth: '92vw',
          background: 'rgba(255, 255, 255, 0.95)',
          borderLeft: '1px solid rgba(71, 85, 140, 0.13)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(71, 85, 140, 0.104)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(71, 85, 140, 0.026)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '6px',
                background: 'rgba(124, 92, 214, 0.15)',
                border: '1px solid rgba(124, 92, 214, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'none',
              }}
            >
              <FileText size={16} color="#7c5cd6" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1f2638' }}>
                FinCEN Suspicious Activity Report (SAR)
              </div>
              <div className="mono" style={{ fontSize: '11px', color: '#556078' }}>
                Docket Ref: SAR-{caseId} • Regulatory Filing
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{}}
            whileTap={{}}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#556078',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </motion.button>
        </div>

        {/* Drawer Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '14px',
              borderRadius: '6px',
              background: '#f6f7fa',
              border: '1px solid rgba(71, 85, 140, 0.078)',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7388', fontWeight: 600 }}>
                TOTAL SUSPICIOUS AMOUNT
              </div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#dc3c45', marginTop: '2px', textShadow: '0 0 12px rgba(220, 60, 69, 0.3)' }}>
                ${sar.total_amount_usd.toFixed(2)} USD
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7388', fontWeight: 600 }}>
                ACTIVITY DATE WINDOW
              </div>
              <div className="mono" style={{ fontSize: '12px', fontWeight: 600, color: '#1f2638', marginTop: '4px' }}>
                {sar.activity_dates?.[0] || '2016-12-08'} to {sar.activity_dates?.[1] || '2016-12-08'}
              </div>
            </div>
          </div>

          {/* Filing Justification */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1f2638' }}>
              REGULATORY FILING JUSTIFICATION
            </span>
            <div
              style={{
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: '6px',
                background: 'rgba(220, 60, 69, 0.08)',
                border: '1px solid rgba(220, 60, 69, 0.25)',
                fontSize: '12px',
                color: '#1f2638',
                lineHeight: 1.45,
              }}
            >
              {sar.reason}
            </div>
          </div>

          {/* Named Subjects */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1f2638' }}>
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
                    borderRadius: '4px',
                    background: 'rgba(79, 99, 210, 0.1)',
                    border: '1px solid rgba(79, 99, 210, 0.3)',
                    color: '#4f63d2',
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
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1f2638' }}>
                STANDALONE SAR NARRATIVE
              </span>
              <motion.button
                whileHover={{}}
                whileTap={{}}
                onClick={handleCopy}
                style={{
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'rgba(71, 85, 140, 0.078)',
                  border: '1px solid rgba(71, 85, 140, 0.104)',
                  color: '#1f2638',
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                <span>{copied ? 'Copied!' : 'Copy Narrative'}</span>
              </motion.button>
            </div>

            <div
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '6px',
                background: '#f6f7fa',
                border: '1px solid rgba(71, 85, 140, 0.091)',
                fontSize: '12px',
                lineHeight: 1.6,
                color: '#1f2638',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                boxShadow: 'none',
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
            borderTop: '1px solid rgba(71, 85, 140, 0.104)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f6f7fa',
          }}
        >
          <div style={{ fontSize: '11px', color: '#6b7388' }}>
            Complies with FinCEN Narrative Guidance & Rule R2/R6
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button
              whileHover={{}}
              whileTap={{}}
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(71, 85, 140, 0.078)',
                border: '1px solid rgba(71, 85, 140, 0.13)',
                color: '#1f2638',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={12} />
              <span>Export SAR JSON</span>
            </motion.button>
            <motion.button
              whileHover={{}}
              whileTap={{}}
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: '#4f63d2',
                border: '1px solid #4f63d2',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'none',
              }}
            >
              <span>Close Dossier</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

