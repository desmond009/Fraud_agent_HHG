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
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
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
          background: 'rgba(18, 18, 24, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.2)',
              }}
            >
              <FileText size={16} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f4f4f5' }}>
                FinCEN Suspicious Activity Report (SAR)
              </div>
              <div className="mono" style={{ fontSize: '11px', color: '#a1a1aa' }}>
                Docket Ref: SAR-{caseId} • Regulatory Filing
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
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
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#71717a', fontWeight: 600 }}>
                TOTAL SUSPICIOUS AMOUNT
              </div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: '#f43f5e', marginTop: '2px', textShadow: '0 0 12px rgba(244, 63, 94, 0.3)' }}>
                ${sar.total_amount_usd.toFixed(2)} USD
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#71717a', fontWeight: 600 }}>
                ACTIVITY DATE WINDOW
              </div>
              <div className="mono" style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', marginTop: '4px' }}>
                {sar.activity_dates?.[0] || '2016-12-08'} to {sar.activity_dates?.[1] || '2016-12-08'}
              </div>
            </div>
          </div>

          {/* Filing Justification */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f4f4f5' }}>
              REGULATORY FILING JUSTIFICATION
            </span>
            <div
              style={{
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                fontSize: '12px',
                color: '#f4f4f5',
                lineHeight: 1.45,
              }}
            >
              {sar.reason}
            </div>
          </div>

          {/* Named Subjects */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f4f4f5' }}>
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
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
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
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f4f4f5' }}>
                STANDALONE SAR NARRATIVE
              </span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCopy}
                style={{
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#f4f4f5',
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                <span>{copied ? 'Copied!' : 'Copy Narrative'}</span>
              </motion.button>
            </div>

            <div
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                fontSize: '12px',
                lineHeight: 1.6,
                color: '#e4e4e7',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
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
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#71717a' }}>
            Complies with FinCEN Narrative Guidance & Rule R2/R6
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f4f4f5',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={12} />
              <span>Export SAR JSON</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: '#0ea5e9',
                border: '1px solid #38bdf8',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(14, 165, 233, 0.3)',
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

