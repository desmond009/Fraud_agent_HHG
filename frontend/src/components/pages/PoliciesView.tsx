import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Zap,
  BookOpen,
  Search,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  X,
  Flame,
  Layers,
  Lock,
  FileText,
  AlertTriangle,
  Check,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { PolicyRule } from '../../types';
import {
  snappyTransition,
  fadeSlideUp,
  fadeSlideInRight,
  staggerContainer,
  staggerItem,
} from '../../utils/motion';

interface PoliciesViewProps {
  policies: PolicyRule[];
  onInvestigateCase?: (caseId: string) => void;
}

// 60FPS Smooth Count-Up Animation for executive stat cards
const AnimatedCounter: React.FC<{ value: number; prefix?: string; suffix?: string; duration?: number }> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 0.9,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = 0;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startVal + (value - startVal) * ease);
      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

// 16 Complete Baseline Policies & Typologies matching TigerGraph RAG index
const BASELINE_POLICIES: PolicyRule[] = [
  {
    id: 'RULE_R1',
    category: 'rule',
    rule_id: 'R1',
    title: 'Verify before you block on a weak signal',
    approval_route: 'auto',
    content:
      'Rule R1. Verify before you block on a weak signal. If the case rests on a single signal (including a risk score alone) and your assessed fraud probability is below 0.70, recommend VERIFY_WITH_CUSTOMER or STEP_UP_AUTH before any block.',
  },
  {
    id: 'RULE_R2',
    category: 'rule',
    rule_id: 'R2',
    title: 'Customer denies the transaction',
    approval_route: 'L1/L2',
    content:
      "Rule R2. Customer denies the transaction. Recommend BLOCK_CARD and CREATE_CASE. Add FILE_REPORT if exposure exceeds $1,000 or the case connects to a shared device profile or another card's fraud.",
  },
  {
    id: 'RULE_R3',
    category: 'rule',
    rule_id: 'R3',
    title: 'Customer confirms the transaction',
    approval_route: 'auto',
    content:
      'Rule R3. Customer confirms the transaction. Recommend CLOSE_NO_FRAUD. Note the confirmation in the case file.',
  },
  {
    id: 'RULE_R4',
    category: 'rule',
    rule_id: 'R4',
    title: 'No reply within 24 hours',
    approval_route: 'auto/L1',
    content:
      'Rule R4. No reply within 24 hours. Recommend MONITOR_CARD (auto) and DECLINE_TRANSACTION (L1) for pending authorizations. Escalate if exposure exceeds $500.',
  },
  {
    id: 'RULE_R5',
    category: 'rule',
    rule_id: 'R5',
    title: 'Card testing sequence',
    approval_route: 'L1/auto',
    content:
      'Rule R5. Card testing. Three or more small online authorizations on one card within an hour, followed by a larger purchase: recommend DECLINE_TRANSACTION (L1) and STEP_UP_AUTH (auto). If a purchase over $100 has already cleared, recommend BLOCK_CARD.',
  },
  {
    id: 'RULE_R6',
    category: 'rule',
    rule_id: 'R6',
    title: 'Shared origin and connected devices/regions',
    approval_route: 'auto/L2',
    content:
      'Rule R6. Shared origin. When several cards show fraud from the same device profile, billing region (addr1), or recipient email in one window, recommend CREATE_CASE and FILE_REPORT (L2), and MONITOR_CONNECTED_CARDS (auto).',
  },
  {
    id: 'RULE_R7',
    category: 'rule',
    rule_id: 'R7',
    title: 'Disputed but legitimate recurring transaction',
    approval_route: 'auto',
    content:
      'Rule R7. Disputed but legitimate. When the customer disputes a charge that matches their own recurring pattern, recommend CREATE_CASE, VERIFY_WITH_CUSTOMER, and WARN_CUSTOMER. Do not block.',
  },
  {
    id: 'RULE_R8',
    category: 'rule',
    rule_id: 'R8',
    title: 'Escalate when uncertain and exposed',
    approval_route: 'auto',
    content:
      'Rule R8. Escalate when uncertain and exposed. If the verdict is uncertain and exposure exceeds $500, or evidence conflicts, recommend ESCALATE_TO_ANALYST.',
  },
  {
    id: 'RULE_R9',
    category: 'rule',
    rule_id: 'R9',
    title: 'Undocumented patterns',
    approval_route: 'auto/L2',
    content:
      'Rule R9. Undocumented patterns. When activity fits none of the known patterns but shows coordinated abuse, recommend CREATE_CASE, FILE_REPORT (L2), and ESCALATE_TO_ANALYST.',
  },
  {
    id: 'RULE_R10',
    category: 'rule',
    rule_id: 'R10',
    title: 'Never block all cards unless compromise confirmed',
    approval_route: 'L2',
    content:
      "Rule R10. Never BLOCK_ALL_CARDS unless at least two of the customer's cards show confirmed fraud or credentials confirmed compromised.",
  },
  {
    id: 'PATTERN_CARD_TESTING',
    category: 'pattern',
    rule_id: 'card_testing',
    title: 'Pattern 1: Card testing',
    approval_route: 'R5',
    content:
      'A stolen card number is checked before use: three or more tiny online authorizations, often under $5, then a larger purchase. Confirmed by the sequence itself.',
  },
  {
    id: 'PATTERN_CNP',
    category: 'pattern',
    rule_id: 'card_not_present_fraud',
    title: 'Pattern 2: Card-not-present fraud',
    approval_route: 'R1-R4',
    content:
      'The number is used online without the physical card. Amounts and products that do not fit cardholder history in a burst of 2-4 in 48 hours.',
  },
  {
    id: 'PATTERN_CNP_NEW_DEVICE',
    category: 'pattern',
    rule_id: 'card_not_present_new_device',
    title: 'Pattern 3: Card-not-present from a new device',
    approval_route: 'R1-R4',
    content:
      'Online card-not-present fraud with identity record marking device as New for this account.',
  },
  {
    id: 'PATTERN_OUT_OF_REGION',
    category: 'pattern',
    rule_id: 'out_of_region_use',
    title: 'Pattern 4: Out-of-region use',
    approval_route: 'R2-R3',
    content:
      'Card-present purchases in a billing region the cardholder has no history in, while normal activity continues at home.',
  },
  {
    id: 'PATTERN_ATO',
    category: 'pattern',
    rule_id: 'account_takeover',
    title: 'Pattern 5: Account takeover',
    approval_route: 'R10',
    content:
      'Mixed-channel activity inconsistent with cardholder, often with device and match-flag anomalies.',
  },
  {
    id: 'REG_FINCEN_SAR',
    category: 'regulatory',
    rule_id: 'FINCEN_SAR',
    title: 'FinCEN Suspicious Activity Report (SAR) Filing Directive',
    approval_route: 'L2',
    content:
      'A Suspicious Activity Report (FILE_REPORT) is a mandatory standalone regulatory filing sent outside the bank when confirmed or strongly suspected fraud exceeds $1,000 or connects to organized fraud rings.',
  },
];

// Associated Benchmark Cases mapping for each policy
const POLICY_BENCHMARK_MAP: Record<string, string[]> = {
  R1: ['HHG-001', 'HHG-005', 'HHG-012', 'HHG-016', 'HHG-020'],
  R2: ['HHG-002', 'HHG-003', 'HHG-004', 'HHG-006', 'HHG-007', 'HHG-011'],
  R3: ['HHG-001', 'HHG-008', 'HHG-018'],
  R4: ['HHG-004', 'HHG-013'],
  R5: ['HHG-002', 'HHG-013'],
  R6: ['HHG-007', 'HHG-010', 'HHG-014', 'HHG-019'],
  R7: ['HHG-009', 'HHG-012'],
  R8: ['HHG-015', 'HHG-017'],
  R9: ['HHG-014', 'HHG-019'],
  R10: ['HHG-006', 'HHG-010'],
  card_testing: ['HHG-002', 'HHG-013'],
  card_not_present_fraud: ['HHG-004', 'HHG-011', 'HHG-015'],
  card_not_present_new_device: ['HHG-005', 'HHG-014'],
  out_of_region_use: ['HHG-001', 'HHG-007', 'HHG-012'],
  account_takeover: ['HHG-010', 'HHG-019'],
  FINCEN_SAR: ['HHG-002', 'HHG-006', 'HHG-007', 'HHG-010', 'HHG-011', 'HHG-015'],
};

// Next-Best Actions keywords mapping
const EXTRACTED_ACTIONS_MAP: Record<string, string[]> = {
  R1: ['VERIFY_WITH_CUSTOMER', 'STEP_UP_AUTH'],
  R2: ['BLOCK_CARD', 'CREATE_CASE', 'FILE_REPORT'],
  R3: ['CLOSE_NO_FRAUD', 'LOG_CONFIRMATION'],
  R4: ['MONITOR_CARD', 'DECLINE_TRANSACTION'],
  R5: ['DECLINE_TRANSACTION', 'STEP_UP_AUTH', 'BLOCK_CARD'],
  R6: ['CREATE_CASE', 'FILE_REPORT', 'MONITOR_CONNECTED_CARDS'],
  R7: ['CREATE_CASE', 'VERIFY_WITH_CUSTOMER', 'WARN_CUSTOMER'],
  R8: ['ESCALATE_TO_ANALYST'],
  R9: ['CREATE_CASE', 'FILE_REPORT', 'ESCALATE_TO_ANALYST'],
  R10: ['BLOCK_ALL_CARDS', 'VERIFY_COMPROMISE'],
  card_testing: ['R5_TRIGGER', 'DECLINE_AUTH'],
  card_not_present_fraud: ['CNP_DEFENSE', 'STEP_UP_AUTH'],
  card_not_present_new_device: ['DEVICE_CHALLENGE', 'STEP_UP_AUTH'],
  out_of_region_use: ['GEOLOCATION_CHECK', 'WARN_CUSTOMER'],
  account_takeover: ['CREDENTIAL_RESET', 'BLOCK_ALL_CARDS'],
  FINCEN_SAR: ['FILE_REPORT', 'L2_COMPLIANCE_SIGN_OFF'],
};

export const PoliciesView: React.FC<PoliciesViewProps> = ({ policies, onInvestigateCase }) => {
  const [filter, setFilter] = useState<'all' | 'rule' | 'pattern' | 'regulatory'>('all');
  const [search, setSearch] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyRule | null>(null);

  // Merge live policies or fall back to 16 baseline policies
  const items = useMemo(() => {
    if (policies && policies.length > 0) return policies;
    return BASELINE_POLICIES;
  }, [policies]);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (filter !== 'all' && p.category !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.rule_id.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.approval_route.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, filter, search]);

  const getRouteBadge = (route: string) => {
    const r = route.toLowerCase();
    if (r.includes('l2')) {
      return {
        label: 'L2 MANAGER',
        bg: 'rgba(168, 85, 247, 0.15)',
        color: '#c084fc',
        border: 'rgba(168, 85, 247, 0.35)',
      };
    }
    if (r.includes('l1')) {
      return {
        label: 'L1 LEAD',
        bg: 'rgba(245, 158, 11, 0.15)',
        color: '#f59e0b',
        border: 'rgba(245, 158, 11, 0.35)',
      };
    }
    return {
      label: 'AUTO AGENT',
      bg: 'rgba(14, 165, 233, 0.15)',
      color: '#38bdf8',
      border: 'rgba(14, 165, 233, 0.35)',
    };
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'rule':
        return {
          gradient: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
          icon: <Shield size={14} color="#38bdf8" />,
          pillBg: 'rgba(14, 165, 233, 0.15)',
          pillColor: '#38bdf8',
          pillBorder: 'rgba(14, 165, 233, 0.35)',
        };
      case 'pattern':
        return {
          gradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
          icon: <Zap size={14} color="#f59e0b" />,
          pillBg: 'rgba(245, 158, 11, 0.15)',
          pillColor: '#f59e0b',
          pillBorder: 'rgba(245, 158, 11, 0.35)',
        };
      case 'regulatory':
        return {
          gradient: 'linear-gradient(90deg, #a855f7, #c084fc)',
          icon: <Scale size={14} color="#c084fc" />,
          pillBg: 'rgba(168, 85, 247, 0.15)',
          pillColor: '#c084fc',
          pillBorder: 'rgba(168, 85, 247, 0.35)',
        };
      default:
        return {
          gradient: 'linear-gradient(90deg, #71717a, #a1a1aa)',
          icon: <BookOpen size={14} color="#cbd5e1" />,
          pillBg: 'rgba(255, 255, 255, 0.1)',
          pillColor: '#cbd5e1',
          pillBorder: 'rgba(255, 255, 255, 0.2)',
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', position: 'relative' }}>
      {/* 1. Header Area */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
              Fraud Policy & Regulatory Standard (v1.0)
            </h2>
            <span
              className="mono"
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(14, 165, 233, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(14, 165, 233, 0.3)',
              }}
            >
              GraphRAG Vector Indexed
            </span>
          </div>
          <p style={{ fontSize: '11.5px', color: '#a1a1aa', marginTop: '3px' }}>
            Operational rules R1 through R10, FinCEN SAR narrative directives, and approval routing hierarchies governing agent actions.
          </p>
        </div>
      </div>

      {/* 2. Top Executive Compliance Metrics Bar */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Metric 1: Operational Rules */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -2, borderColor: 'rgba(255, 255, 255, 0.16)' }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'rgba(20, 20, 25, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
              Operational Rules
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 7px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 700,
                background: 'rgba(14, 165, 233, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(14, 165, 233, 0.3)',
              }}
            >
              <Shield size={10} />
              <span>R1 – R10 Active</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span className="mono" style={{ fontSize: '24px', fontWeight: 800, color: '#f4f4f5' }}>
              <AnimatedCounter value={10} suffix=" Rules" />
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
            <ShieldCheck size={12} />
            <span>Autonomous & Supervised</span>
          </div>
        </motion.div>

        {/* Metric 2: Known Typologies */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -2, borderColor: 'rgba(255, 255, 255, 0.16)' }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'rgba(20, 20, 25, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
              Attack Typologies
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '9999px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              5 Patterns
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span className="mono" style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>
              <AnimatedCounter value={5} suffix=" Typologies" />
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>
            <Zap size={12} color="#f59e0b" />
            <span>Card Testing, CNP, ATO</span>
          </div>
        </motion.div>

        {/* Metric 3: Regulatory Standard */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -2, borderColor: 'rgba(255, 255, 255, 0.16)' }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'rgba(20, 20, 25, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
              Regulatory Filing
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '9999px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              FinCEN SAR
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span className="mono" style={{ fontSize: '24px', fontWeight: 800, color: '#f4f4f5' }}>
              &gt; $1,000 USD
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#c084fc', marginTop: '4px', fontWeight: 600 }}>
            <Scale size={12} />
            <span>Mandatory External SAR</span>
          </div>
        </motion.div>

        {/* Metric 4: GraphRAG Similarity */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -2, borderColor: 'rgba(255, 255, 255, 0.16)' }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'rgba(20, 20, 25, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
              GraphRAG Similarity
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              16 / 16
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span className="mono" style={{ fontSize: '24px', fontWeight: 800, color: '#f4f4f5' }}>
              <AnimatedCounter value={100} suffix="%" />
            </span>
            <span style={{ fontSize: '11px', color: '#71717a' }}>indexed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
            <Sparkles size={12} />
            <span>384-Dim Vector Memory</span>
          </div>
        </motion.div>
      </motion.div>

      {/* 3. Controls & Filter Bar (Linear style pills with layoutId sliding) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(20, 20, 25, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '8px 12px',
        }}
      >
        {/* Left: Category Filter Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '2px',
            position: 'relative',
          }}
        >
          <button
            onClick={() => setFilter('all')}
            style={{
              position: 'relative',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: filter === 'all' ? '#f4f4f5' : '#71717a',
              zIndex: 2,
              transition: 'color 0.15s ease',
            }}
          >
            {filter === 'all' && (
              <motion.div
                layoutId="policyFilterPill"
                transition={snappyTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  zIndex: -1,
                }}
              />
            )}
            All Policies (16)
          </button>

          <button
            onClick={() => setFilter('rule')}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: filter === 'rule' ? '#38bdf8' : '#71717a',
              zIndex: 2,
              transition: 'color 0.15s ease',
            }}
          >
            {filter === 'rule' && (
              <motion.div
                layoutId="policyFilterPill"
                transition={snappyTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '4px',
                  background: 'rgba(14, 165, 233, 0.2)',
                  border: '1px solid rgba(14, 165, 233, 0.35)',
                  zIndex: -1,
                }}
              />
            )}
            <Shield size={11} />
            Rules (R1–R10)
          </button>

          <button
            onClick={() => setFilter('pattern')}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: filter === 'pattern' ? '#f59e0b' : '#71717a',
              zIndex: 2,
              transition: 'color 0.15s ease',
            }}
          >
            {filter === 'pattern' && (
              <motion.div
                layoutId="policyFilterPill"
                transition={snappyTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  zIndex: -1,
                }}
              />
            )}
            <Zap size={11} />
            Known Typologies
          </button>

          <button
            onClick={() => setFilter('regulatory')}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: filter === 'regulatory' ? '#c084fc' : '#71717a',
              zIndex: 2,
              transition: 'color 0.15s ease',
            }}
          >
            {filter === 'regulatory' && (
              <motion.div
                layoutId="policyFilterPill"
                transition={snappyTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '4px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  zIndex: -1,
                }}
              />
            )}
            <Scale size={11} />
            FinCEN Standards
          </button>
        </div>

        {/* Right: Universal Search */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={14} color="#71717a" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search policies or rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '6px 28px 6px 30px',
              color: '#f4f4f5',
              fontSize: '11.5px',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(14, 165, 233, 0.6)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 4. High-Aesthetic Policy Cards Grid with Waterfall Stagger */}
      <motion.div
        key={`${filter}-${search}`}
        variants={{
          initial: {},
          animate: {
            transition: {
              staggerChildren: 0.035,
              delayChildren: 0.04,
            },
          },
        }}
        initial="initial"
        animate="animate"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '14px',
        }}
      >
        {filtered.map((item) => {
          const theme = getCategoryTheme(item.category);
          const route = getRouteBadge(item.approval_route);
          const linkedCases = POLICY_BENCHMARK_MAP[item.rule_id] || [];
          const actions = EXTRACTED_ACTIONS_MAP[item.rule_id] || ['EVALUATE_GRAPH'];

          return (
            <motion.div
              key={item.id}
              variants={{
                initial: { opacity: 0, y: 10 },
                animate: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={{
                y: -3,
                borderColor: 'rgba(255, 255, 255, 0.18)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              }}
              transition={{ duration: 0.18 }}
              onClick={() => setSelectedPolicy(item)}
              style={{
                background: 'rgba(20, 20, 25, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.4)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              {/* Category Gradient Top Accent Bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: theme.gradient,
                }}
              />

              {/* Card Header: Rule ID pill & Route pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: theme.pillBg,
                      color: theme.pillColor,
                      border: `1px solid ${theme.pillBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {theme.icon}
                    <span>{item.rule_id}</span>
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#71717a', textTransform: 'capitalize' }}>
                    {item.category}
                  </span>
                </div>

                {/* Clearance Route Badge */}
                <span
                  className="mono"
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: route.bg,
                    color: route.color,
                    border: `1px solid ${route.border}`,
                    letterSpacing: '0.04em',
                  }}
                >
                  ROUTE: {route.label}
                </span>
              </div>

              {/* Title */}
              <div>
                <h3
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#f4f4f5',
                    margin: 0,
                    lineHeight: 1.35,
                  }}
                >
                  {item.title}
                </h3>

                {/* Content description */}
                <p
                  style={{
                    fontSize: '11.5px',
                    color: '#a1a1aa',
                    lineHeight: 1.55,
                    marginTop: '8px',
                    marginBottom: 0,
                  }}
                >
                  {item.content}
                </p>
              </div>

              {/* Prescribed Next-Best Actions pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {actions.map((act) => (
                  <span
                    key={act}
                    className="mono"
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {act}
                  </span>
                ))}
              </div>

              {/* Card Footer: Linked Benchmark Cases & Inspect Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '10.5px',
                  color: '#71717a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GitBranch size={11} color="#38bdf8" />
                  <span>
                    <strong style={{ color: '#f4f4f5' }}>{linkedCases.length}</strong> benchmark cases
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#38bdf8',
                    fontWeight: 600,
                  }}
                >
                  <span>Details</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 5. Policy Deep-Dive Inspector Drawer */}
      <AnimatePresence>
        {selectedPolicy && (
          <motion.div
            variants={fadeSlideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '440px',
              maxWidth: '92vw',
              background: 'rgba(11, 17, 28, 0.96)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.8)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                background: 'rgba(11, 17, 28, 0.98)',
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="mono"
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: getCategoryTheme(selectedPolicy.category).pillBg,
                    color: getCategoryTheme(selectedPolicy.category).pillColor,
                    border: `1px solid ${getCategoryTheme(selectedPolicy.category).pillBorder}`,
                  }}
                >
                  {selectedPolicy.rule_id}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f4f4f5' }}>
                  Policy Specification
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedPolicy(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                }}
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {/* Title & Category Banner */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#71717a', fontWeight: 700 }}>
                    Category: <strong style={{ color: '#38bdf8' }}>{selectedPolicy.category}</strong>
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: getRouteBadge(selectedPolicy.approval_route).bg,
                      color: getRouteBadge(selectedPolicy.approval_route).color,
                      border: `1px solid ${getRouteBadge(selectedPolicy.approval_route).border}`,
                    }}
                  >
                    ROUTE: {getRouteBadge(selectedPolicy.approval_route).label}
                  </span>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f4f4f5', margin: '4px 0 0 0' }}>
                  {selectedPolicy.title}
                </h3>
              </div>

              {/* Exact Policy Directive Mandate */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
                  Mandate & Operational Contract
                </span>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '12px',
                    color: '#d4d4d8',
                    lineHeight: 1.6,
                  }}
                >
                  {selectedPolicy.content}
                </div>
              </div>

              {/* Prescribed Next-Best Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
                  Governed Autonomous / Analyst Actions
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(EXTRACTED_ACTIONS_MAP[selectedPolicy.rule_id] || ['EVALUATE_GRAPH']).map((act) => (
                    <div
                      key={act}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'rgba(14, 165, 233, 0.08)',
                        border: '1px solid rgba(14, 165, 233, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
                        {act}
                      </span>
                      <span style={{ fontSize: '10px', color: '#a1a1aa' }}>
                        {getRouteBadge(selectedPolicy.approval_route).label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked 20 Benchmark Test Cases */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
                  Linked Benchmark Test Cases ({POLICY_BENCHMARK_MAP[selectedPolicy.rule_id]?.length || 0})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(POLICY_BENCHMARK_MAP[selectedPolicy.rule_id] || []).map((caseId) => (
                    <button
                      key={caseId}
                      onClick={() => {
                        if (onInvestigateCase) {
                          onInvestigateCase(caseId);
                          setSelectedPolicy(null);
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#f4f4f5',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(14, 165, 233, 0.18)';
                        e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.4)';
                        e.currentTarget.style.color = '#38bdf8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#f4f4f5';
                      }}
                    >
                      <span className="mono" style={{ color: '#38bdf8', fontWeight: 700 }}>
                        {caseId}
                      </span>
                      <ArrowRight size={10} color="#a1a1aa" />
                    </button>
                  ))}
                </div>
              </div>

              {/* TigerGraph GraphRAG Vector Memory Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
                  TigerGraph GraphRAG Vector Embeddings
                </span>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '11px',
                    color: '#a1a1aa',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                  className="mono"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Embedding Model:</span>
                    <span style={{ color: '#f4f4f5' }}>sentence-transformers</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Dimensions:</span>
                    <span style={{ color: '#f4f4f5' }}>384 dense floats</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cosine Similarity Gate:</span>
                    <span style={{ color: '#10b981' }}>&ge; 0.78 threshold</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            {POLICY_BENCHMARK_MAP[selectedPolicy.rule_id]?.length > 0 && onInvestigateCase && (
              <div
                style={{
                  padding: '14px 16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(11, 17, 28, 0.98)',
                  position: 'sticky',
                  bottom: 0,
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#38bdf8' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const firstCase = POLICY_BENCHMARK_MAP[selectedPolicy.rule_id][0];
                    onInvestigateCase(firstCase);
                    setSelectedPolicy(null);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    borderRadius: '6px',
                    background: '#0ea5e9',
                    border: 'none',
                    color: '#09090b',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 0 16px rgba(14, 165, 233, 0.3)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span>
                    Inspect Benchmark Case {POLICY_BENCHMARK_MAP[selectedPolicy.rule_id][0]} in Workspace
                  </span>
                  <ArrowRight size={13} />
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
