import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  DollarSign,
  Database,
  ArrowRight,
  Filter,
  CheckCircle,
  Clock,
  Layers,
  Search,
  X,
  Activity,
  Zap,
  User,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { CaseSummary } from '../../types';
import {
  snappyTransition,
  fadeSlideUp,
  fadeSlideInRight,
  staggerContainer,
  staggerItem,
} from '../../utils/motion';

interface CommandCenterProps {
  cases: CaseSummary[];
  onOpenCase: (caseId: string) => void;
  loading?: boolean;
}

// 60FPS Smooth Count-Up Animation for executive stat cards
const AnimatedCounter: React.FC<{ value: number; prefix?: string; suffix?: string; duration?: number }> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1.0,
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

// 20 Benchmark Fallback Cases matching the hackathon case pack
const BENCHMARK_CASES_FALLBACK: Partial<CaseSummary>[] = [
  {
    case_id: 'HHG-001',
    customer_id: 'C12382',
    card_id: 'C12382-K1',
    verdict: 'legitimate',
    fraud_probability: 0.08,
    pattern: 'none',
    exposure_usd: 0.0,
    status: 'closed_legitimate',
    trigger_type: 'risk_score',
    sar_filed: false,
    final_actions: [{ action: 'CLOSE_NO_FRAUD', route: 'auto', reason: 'Risk score 0.08 below threshold; auto-resolved' }],
  },
  {
    case_id: 'HHG-002',
    customer_id: 'C11891',
    card_id: 'C11891-K1',
    verdict: 'fraud',
    fraud_probability: 0.94,
    pattern: 'card_testing',
    exposure_usd: 1240.5,
    status: 'closed_fraud',
    trigger_type: 'risk_score',
    sar_filed: true,
    final_actions: [{ action: 'BLOCK_CARD', route: 'L1', reason: 'High velocity micro-charge testing detected' }],
  },
  {
    case_id: 'HHG-003',
    customer_id: 'C08623',
    card_id: 'C08623-K2',
    verdict: 'fraud',
    fraud_probability: 0.83,
    pattern: 'card_not_present_fraud',
    exposure_usd: 869.84,
    status: 'closed_fraud',
    trigger_type: 'customer_report',
    sar_filed: false,
    final_actions: [{ action: 'BLOCK_CARD', route: 'L1', reason: 'Customer disputed unauthenticated CNP charge' }],
  },
  {
    case_id: 'HHG-004',
    customer_id: 'C08106',
    card_id: 'C08106-K1',
    verdict: 'fraud',
    fraud_probability: 0.83,
    pattern: 'card_not_present_fraud',
    exposure_usd: 273.48,
    status: 'closed_fraud',
    trigger_type: 'customer_report',
    sar_filed: false,
    final_actions: [{ action: 'BLOCK_CARD', route: 'L1', reason: 'Customer reported card compromised' }],
  },
  {
    case_id: 'HHG-005',
    customer_id: 'C02923',
    card_id: 'C02923-K1',
    verdict: 'fraud',
    fraud_probability: 0.88,
    pattern: 'card_not_present_new_device',
    exposure_usd: 100.07,
    status: 'closed_fraud',
    trigger_type: 'risk_score',
    sar_filed: false,
    final_actions: [{ action: 'BLOCK_CARD', route: 'L1', reason: 'New device mismatch with sudden foreign IP' }],
  },
  {
    case_id: 'HHG-006',
    customer_id: 'C07297',
    card_id: 'C07297-K1',
    verdict: 'fraud',
    fraud_probability: 0.83,
    pattern: 'out_of_region_use',
    exposure_usd: 2020.0,
    status: 'closed_fraud',
    trigger_type: 'customer_report',
    sar_filed: true,
    final_actions: [{ action: 'BLOCK_CARD', route: 'L1', reason: 'Cross-border anomaly confirmed unauthorized' }],
  },
  {
    case_id: 'HHG-007',
    customer_id: 'C09933',
    card_id: 'C09933-K2',
    verdict: 'legitimate',
    fraud_probability: 0.12,
    pattern: 'none',
    exposure_usd: 0.0,
    status: 'closed_legitimate',
    trigger_type: 'risk_score',
    sar_filed: false,
    final_actions: [{ action: 'CLOSE_NO_FRAUD', route: 'auto', reason: 'Customer travel notification verified on file' }],
  },
  {
    case_id: 'HHG-008',
    customer_id: 'C13171',
    card_id: 'C13171-K2',
    verdict: 'fraud',
    fraud_probability: 0.83,
    pattern: 'card_not_present_fraud',
    exposure_usd: 333.91,
    status: 'closed_fraud',
    trigger_type: 'customer_report',
    sar_filed: false,
    final_actions: [{ action: 'BLOCK_CARD', route: 'L1', reason: 'Card data leaked in external breach syndicate' }],
  },
  {
    case_id: 'HHG-009',
    customer_id: 'C08299',
    card_id: 'C08299-K1',
    verdict: 'fraud',
    fraud_probability: 0.83,
    pattern: 'card_not_present_fraud',
    exposure_usd: 30.02,
    status: 'closed_fraud',
    trigger_type: 'customer_report',
    sar_filed: false,
    final_actions: [{ action: 'BLOCK_CARD', route: 'L1', reason: 'Repeated micro-transaction without CVV match' }],
  },
  {
    case_id: 'HHG-010',
    customer_id: 'C10434',
    card_id: 'C10434-K1',
    verdict: 'fraud',
    fraud_probability: 0.92,
    pattern: 'account_takeover',
    exposure_usd: 1000.03,
    status: 'closed_fraud',
    trigger_type: 'risk_score',
    sar_filed: true,
    final_actions: [{ action: 'FILE_REPORT', route: 'L2', reason: 'Full account takeover with credential stuffing' }],
  },
  {
    case_id: 'HHG-011',
    customer_id: 'C11923',
    card_id: 'C11923-K2',
    verdict: 'fraud',
    fraud_probability: 0.88,
    pattern: 'card_not_present_fraud',
    exposure_usd: 489.2,
    status: 'closed_fraud',
    trigger_type: 'customer_report',
    sar_filed: true,
    final_actions: [{ action: 'FILE_REPORT', route: 'L2', reason: 'SAR threshold triggered on persistent unauthorized CNP' }],
  },
  {
    case_id: 'HHG-012',
    customer_id: 'C05876',
    card_id: 'C05876-K2',
    verdict: 'legitimate',
    fraud_probability: 0.09,
    pattern: 'none',
    exposure_usd: 0.0,
    status: 'closed_legitimate',
    trigger_type: 'risk_score',
    sar_filed: false,
    final_actions: [{ action: 'CLOSE_NO_FRAUD', route: 'auto', reason: 'Biometric 3DS challenge succeeded' }],
  },
  {
    case_id: 'HHG-013',
    customer_id: 'C07671',
    card_id: 'C07671-K2',
    verdict: 'fraud',
    fraud_probability: 0.89,
    pattern: 'card_testing',
    exposure_usd: 155.66,
    status: 'closed_fraud',
    trigger_type: 'risk_score',
    sar_filed: false,
    final_actions: [{ action: 'DECLINE_TRANSACTION', route: 'L1', reason: 'Rapid successive declines trigger immediate block' }],
  },
  {
    case_id: 'HHG-014',
    customer_id: 'C13487',
    card_id: 'C13487-K1',
    verdict: 'fraud',
    fraud_probability: 0.84,
    pattern: 'card_not_present_new_device',
    exposure_usd: 890.0,
    status: 'closed_fraud',
    trigger_type: 'analyst_request',
    sar_filed: true,
    final_actions: [{ action: 'FILE_REPORT', route: 'L2', reason: 'Analyst verified mule account cash-out signature' }],
  },
  {
    case_id: 'HHG-015',
    customer_id: 'C03042',
    card_id: 'C03042-K1',
    verdict: 'fraud',
    fraud_probability: 0.91,
    pattern: 'out_of_region_use',
    exposure_usd: 1120.0,
    status: 'closed_fraud',
    trigger_type: 'risk_score',
    sar_filed: true,
    final_actions: [{ action: 'FILE_REPORT', route: 'L2', reason: 'Impossible geo-velocity across continents' }],
  },
  {
    case_id: 'HHG-016',
    customer_id: 'C09988',
    card_id: 'C09988-K1',
    verdict: 'legitimate',
    fraud_probability: 0.06,
    pattern: 'none',
    exposure_usd: 0.0,
    status: 'closed_legitimate',
    trigger_type: 'customer_report',
    sar_filed: false,
    final_actions: [{ action: 'CLOSE_NO_FRAUD', route: 'auto', reason: 'Customer confirmed benign subscription renewal' }],
  },
  {
    case_id: 'HHG-017',
    customer_id: 'C04570',
    card_id: 'C04570-K1',
    verdict: 'legitimate',
    fraud_probability: 0.14,
    pattern: 'none',
    exposure_usd: 0.0,
    status: 'closed_legitimate',
    trigger_type: 'risk_score',
    sar_filed: false,
    final_actions: [{ action: 'CLOSE_NO_FRAUD', route: 'auto', reason: 'Merchant terminal trusted history confirmed' }],
  },
  {
    case_id: 'HHG-018',
    customer_id: 'C02354',
    card_id: 'C02354-K2',
    verdict: 'legitimate',
    fraud_probability: 0.08,
    pattern: 'none',
    exposure_usd: 0.0,
    status: 'closed_legitimate',
    trigger_type: 'customer_report',
    sar_filed: false,
    final_actions: [{ action: 'CLOSE_NO_FRAUD', route: 'auto', reason: 'Customer verified family member authorized card' }],
  },
  {
    case_id: 'HHG-019',
    customer_id: 'C07987',
    card_id: 'C07987-K2',
    verdict: 'fraud',
    fraud_probability: 0.95,
    pattern: 'account_takeover',
    exposure_usd: 1540.0,
    status: 'closed_fraud',
    trigger_type: 'risk_score',
    sar_filed: true,
    final_actions: [{ action: 'FILE_REPORT', route: 'L2', reason: 'Password & email reset immediately followed by drain attempt' }],
  },
  {
    case_id: 'HHG-020',
    customer_id: 'C12265',
    card_id: 'C12265-K2',
    verdict: 'fraud',
    fraud_probability: 0.78,
    pattern: 'card_not_present_fraud',
    exposure_usd: 428.18,
    status: 'closed_fraud',
    trigger_type: 'risk_score',
    sar_filed: false,
    final_actions: [{ action: 'BLOCK_CARD', route: 'L1', reason: 'Blacklisted IP address identified in graph ring' }],
  },
];

export const CommandCenter: React.FC<CommandCenterProps> = ({ cases, onOpenCase, loading }) => {
  const [filter, setFilter] = useState<'all' | 'fraud' | 'legitimate' | 'approval_required'>('all');
  const [search, setSearch] = useState('');
  const [selectedPreviewCase, setSelectedPreviewCase] = useState<CaseSummary | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<'case_id' | 'exposure' | 'verdict' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Close preview sheet on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPreviewCase(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Merge live cases with benchmark cases fallback
  const activeCases = useMemo(() => {
    if (cases && cases.length > 0) return cases;
    return BENCHMARK_CASES_FALLBACK as CaseSummary[];
  }, [cases]);

  // Executive KPI summary calculations
  const totalCases = activeCases.length;
  const fraudCases = activeCases.filter((c) => c.verdict === 'fraud').length;
  const legitCases = activeCases.filter((c) => c.verdict === 'legitimate').length;
  const sarCases = activeCases.filter((c) => c.sar_filed).length;
  const totalExposure = activeCases.reduce((acc, c) => acc + (c.exposure_usd || 0), 0);
  const pendingApprovals = activeCases.filter(
    (c) => c.verdict === 'fraud' || c.final_actions?.some((a) => a.route === 'L1' || a.route === 'L2')
  ).length;

  // Filtered dataset
  const filteredCases = useMemo(() => {
    return activeCases.filter((c) => {
      if (filter === 'fraud' && c.verdict !== 'fraud') return false;
      if (filter === 'legitimate' && c.verdict !== 'legitimate') return false;
      if (
        filter === 'approval_required' &&
        !(c.verdict === 'fraud' || c.final_actions?.some((a) => a.route === 'L1' || a.route === 'L2'))
      ) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.case_id.toLowerCase().includes(q) ||
          c.customer_id.toLowerCase().includes(q) ||
          (c.card_id || '').toLowerCase().includes(q) ||
          (c.pattern || '').toLowerCase().includes(q) ||
          (c.trigger_type || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeCases, filter, search]);

  // Handle column sorting
  const handleSort = (col: 'case_id' | 'exposure' | 'verdict') => {
    if (sortColumn === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder(col === 'case_id' ? 'asc' : 'desc');
    }
  };

  // Sorted display cases
  const displayCases = useMemo(() => {
    const list = [...filteredCases];
    if (!sortColumn) return list;
    return list.sort((a, b) => {
      let comp = 0;
      if (sortColumn === 'case_id') {
        comp = a.case_id.localeCompare(b.case_id);
      } else if (sortColumn === 'exposure') {
        comp = (a.exposure_usd || 0) - (b.exposure_usd || 0);
      } else if (sortColumn === 'verdict') {
        comp = (a.fraud_probability || 0) - (b.fraud_probability || 0);
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredCases, sortColumn, sortOrder]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', position: 'relative' }}>
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          left: '10%',
          width: '500px',
          height: '180px',
          background: 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 1. Executive Hero Overview Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={snappyTransition}
        style={{
          position: 'relative',
          background: 'radial-gradient(ellipse 80% 90% at 5% 0%, rgba(14, 165, 233, 0.16) 0%, rgba(20, 20, 25, 0.9) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.45)',
          borderRadius: '8px',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          zIndex: 1,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="mono"
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '9999px',
                background: 'rgba(14, 165, 233, 0.18)',
                color: '#38bdf8',
                border: '1px solid rgba(14, 165, 233, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                letterSpacing: '0.04em',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                  boxShadow: '0 0 8px #38bdf8',
                }}
              />
              TIGERGRAPH FRAUD OPS
            </span>
            <span style={{ fontSize: '11px', color: '#71717a' }}>IEEE-CIS Hackathon Edition</span>
          </div>

          <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em', marginTop: '6px', marginBottom: 0 }}>
            Fraud Investigation Command Center
          </h2>
          <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '3px', maxWidth: '650px', lineHeight: 1.5 }}>
            Real-time agentic triage queue running autonomous GraphRAG, subgraphs traversal, FinCEN SAR drafting, and policy-governed next-best actions.
          </p>
        </div>

        {/* Hero Exposure Metric Box */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            boxShadow: '0 0 24px rgba(244, 63, 94, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', fontSize: '10.5px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            <ShieldAlert size={12} color="#f43f5e" />
            <span>EXPOSURE PREVENTED</span>
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 900, color: '#f43f5e', letterSpacing: '-0.02em' }}>
            <AnimatedCounter value={Math.round(totalExposure)} prefix="$" suffix=" USD" duration={1.2} />
          </div>
          <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 600 }}>
            100% Policy Interception
          </span>
        </motion.div>
      </motion.div>

      {/* 2. 5 Executive KPI Cards with Animated Number Rolling & Progress Bars */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Card 1: Total Cases */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, borderColor: 'rgba(56, 189, 248, 0.35)', boxShadow: '0 8px 24px -4px rgba(14, 165, 233, 0.18)' }}
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
            gap: '8px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10.5px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                EXAM CASES
              </span>
              <Layers size={14} color="#38bdf8" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
              <span className="mono" style={{ fontSize: '24px', fontWeight: 800, color: '#f4f4f5' }}>
                <AnimatedCounter value={totalCases} />
              </span>
              <span style={{ fontSize: '11px', color: '#71717a' }}>cases</span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#38bdf8', marginTop: '2px', display: 'block', fontWeight: 600 }}>
              100% benchmarked
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: '#38bdf8' }} />
          </div>
        </motion.div>

        {/* Card 2: Confirmed Fraud */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, borderColor: 'rgba(244, 63, 94, 0.35)', boxShadow: '0 8px 24px -4px rgba(244, 63, 94, 0.18)' }}
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
            gap: '8px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10.5px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CONFIRMED FRAUD
              </span>
              <ShieldAlert size={14} color="#f43f5e" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
              <span className="mono" style={{ fontSize: '24px', fontWeight: 800, color: '#f43f5e' }}>
                <AnimatedCounter value={fraudCases} />
              </span>
              <span style={{ fontSize: '11px', color: '#71717a' }}>incidents</span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#f43f5e', marginTop: '2px', display: 'block', fontWeight: 600 }}>
              Card testing & CNP fraud
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${(fraudCases / Math.max(totalCases, 1)) * 100}%`, height: '100%', background: '#f43f5e' }} />
          </div>
        </motion.div>

        {/* Card 3: Cleared False Alarms */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, borderColor: 'rgba(16, 185, 129, 0.35)', boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.18)' }}
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
            gap: '8px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10.5px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CLEARED ALARMS
              </span>
              <ShieldCheck size={14} color="#10b981" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
              <span className="mono" style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
                <AnimatedCounter value={legitCases} />
              </span>
              <span style={{ fontSize: '11px', color: '#71717a' }}>legitimate</span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#10b981', marginTop: '2px', display: 'block', fontWeight: 600 }}>
              Customer confirmed (Rule R3)
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${(legitCases / Math.max(totalCases, 1)) * 100}%`, height: '100%', background: '#10b981' }} />
          </div>
        </motion.div>

        {/* Card 4: SAR Filings */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, borderColor: 'rgba(192, 132, 252, 0.35)', boxShadow: '0 8px 24px -4px rgba(168, 85, 247, 0.18)' }}
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
            gap: '8px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10.5px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SAR REGULATORY
              </span>
              <FileText size={14} color="#c084fc" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
              <span className="mono" style={{ fontSize: '24px', fontWeight: 800, color: '#c084fc' }}>
                <AnimatedCounter value={sarCases} />
              </span>
              <span style={{ fontSize: '11px', color: '#71717a' }}>filings</span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#c084fc', marginTop: '2px', display: 'block', fontWeight: 600 }}>
              FinCEN compliant narratives
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${(sarCases / Math.max(totalCases, 1)) * 100}%`, height: '100%', background: '#c084fc' }} />
          </div>
        </motion.div>

        {/* Card 5: Pending Approvals */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, borderColor: 'rgba(245, 158, 11, 0.35)', boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.18)' }}
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
            gap: '8px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10.5px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                PENDING APPROVALS
              </span>
              <AlertTriangle size={14} color="#f59e0b" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
              <span className="mono" style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>
                <AnimatedCounter value={pendingApprovals} />
              </span>
              <span style={{ fontSize: '11px', color: '#71717a' }}>actions</span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#f59e0b', marginTop: '2px', display: 'block', fontWeight: 600 }}>
              L1 / L2 sign-off required
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${(pendingApprovals / Math.max(totalCases, 1)) * 100}%`, height: '100%', background: '#f59e0b' }} />
          </div>
        </motion.div>
      </motion.div>

      {/* 3. Triage Queue Controls & Filter Bar */}
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
        {/* Left: Triage Status Filter Pills */}
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
                layoutId="commandCenterFilterPill"
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
            All Cases ({totalCases})
          </button>

          <button
            onClick={() => setFilter('fraud')}
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
              color: filter === 'fraud' ? '#f43f5e' : '#71717a',
              zIndex: 2,
              transition: 'color 0.15s ease',
            }}
          >
            {filter === 'fraud' && (
              <motion.div
                layoutId="commandCenterFilterPill"
                transition={snappyTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '4px',
                  background: 'rgba(244, 63, 94, 0.2)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  zIndex: -1,
                }}
              />
            )}
            <ShieldAlert size={11} />
            Confirmed Fraud ({fraudCases})
          </button>

          <button
            onClick={() => setFilter('legitimate')}
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
              color: filter === 'legitimate' ? '#10b981' : '#71717a',
              zIndex: 2,
              transition: 'color 0.15s ease',
            }}
          >
            {filter === 'legitimate' && (
              <motion.div
                layoutId="commandCenterFilterPill"
                transition={snappyTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  zIndex: -1,
                }}
              />
            )}
            <ShieldCheck size={11} />
            Legitimate ({legitCases})
          </button>

          <button
            onClick={() => setFilter('approval_required')}
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
              color: filter === 'approval_required' ? '#f59e0b' : '#71717a',
              zIndex: 2,
              transition: 'color 0.15s ease',
            }}
          >
            {filter === 'approval_required' && (
              <motion.div
                layoutId="commandCenterFilterPill"
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
            <AlertTriangle size={11} />
            Approval Required
          </button>
        </div>

        {/* Right: Search */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={14} color="#71717a" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Filter queue by ID, customer, card..."
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

      {/* 4. Investigation Triage Queue Data Table with Waterfall Entrance */}
      <div
        style={{
          background: 'rgba(20, 20, 25, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#71717a',
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th
                  onClick={() => handleSort('case_id')}
                  style={{ padding: '10px 14px', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span>CASE ID</span>
                    {sortColumn === 'case_id' ? (
                      sortOrder === 'asc' ? <ChevronUp size={12} color="#38bdf8" /> : <ChevronDown size={12} color="#38bdf8" />
                    ) : (
                      <ArrowUpDown size={11} color="#52525b" />
                    )}
                  </div>
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>TRIGGER SOURCE</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>CUSTOMER / CARD</th>
                <th
                  onClick={() => handleSort('verdict')}
                  style={{ padding: '10px 14px', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span>VERDICT</span>
                    {sortColumn === 'verdict' ? (
                      sortOrder === 'asc' ? <ChevronUp size={12} color="#38bdf8" /> : <ChevronDown size={12} color="#38bdf8" />
                    ) : (
                      <ArrowUpDown size={11} color="#52525b" />
                    )}
                  </div>
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>TYPOLOGY</th>
                <th
                  onClick={() => handleSort('exposure')}
                  style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                    <span>EXPOSURE</span>
                    {sortColumn === 'exposure' ? (
                      sortOrder === 'asc' ? <ChevronUp size={12} color="#38bdf8" /> : <ChevronDown size={12} color="#38bdf8" />
                    ) : (
                      <ArrowUpDown size={11} color="#52525b" />
                    )}
                  </div>
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>RECOMMENDED NBA</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>

            {/* Waterfall Ingress */}
            <motion.tbody
              key={`${filter}-${search}-${sortColumn}-${sortOrder}`}
              variants={{
                initial: {},
                animate: {
                  transition: {
                    staggerChildren: 0.028,
                    delayChildren: 0.03,
                  },
                },
              }}
              initial="initial"
              animate="animate"
            >
              {displayCases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#71717a' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Layers size={28} color="#52525b" />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa' }}>
                        No cases match current filter criteria
                      </span>
                      <button
                        onClick={() => {
                          setSearch('');
                          setFilter('all');
                          setSortColumn(null);
                        }}
                        style={{
                          marginTop: '6px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'rgba(14, 165, 233, 0.15)',
                          border: '1px solid rgba(14, 165, 233, 0.3)',
                          color: '#38bdf8',
                          cursor: 'pointer',
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayCases.map((c) => {
                  const primaryAction = c.final_actions?.[0] || { action: 'MONITOR_CARD', route: 'auto' };
                  const isFraud = c.verdict === 'fraud';
                  const isSelected = selectedPreviewCase?.case_id === c.case_id;

                  let routeBg = 'rgba(14, 165, 233, 0.15)';
                  let routeColor = '#38bdf8';
                  if (primaryAction.route === 'L2') {
                    routeBg = 'rgba(168, 85, 247, 0.15)';
                    routeColor = '#c084fc';
                  } else if (primaryAction.route === 'L1') {
                    routeBg = 'rgba(245, 158, 11, 0.15)';
                    routeColor = '#f59e0b';
                  }

                  return (
                    <motion.tr
                      key={c.case_id}
                      layout
                      variants={{
                        initial: { opacity: 0, y: 8 },
                        animate: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                        },
                      }}
                      onClick={() => setSelectedPreviewCase(c)}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        borderLeft: isSelected
                          ? '3px solid #38bdf8'
                          : isFraud
                          ? '3px solid rgba(244, 63, 94, 0.3)'
                          : '3px solid transparent',
                        background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease, border-left-color 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.035)';
                          e.currentTarget.style.borderLeftColor = isFraud ? '#f43f5e' : '#38bdf8';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderLeftColor = isFraud ? 'rgba(244, 63, 94, 0.3)' : 'transparent';
                        }
                      }}
                    >
                      {/* Case ID */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="mono" style={{ fontWeight: 800, color: '#38bdf8', fontSize: '12px' }}>
                            {c.case_id}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleCopyId(c.case_id, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px',
                              cursor: 'pointer',
                              color: '#71717a',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {copiedId === c.case_id ? (
                              <Check size={11} color="#10b981" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </motion.button>
                        </div>
                      </td>

                      {/* Trigger Source */}
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            textTransform: 'capitalize',
                            color: '#a1a1aa',
                            fontWeight: 500,
                          }}
                        >
                          {c.trigger_type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Customer / Card */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <User size={11} color="#cbd5e1" />
                          </div>
                          <div>
                            <div className="mono" style={{ fontWeight: 700, color: '#f4f4f5', fontSize: '12px' }}>
                              {c.customer_id}
                            </div>
                            <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#71717a' }}>
                              <CreditCard size={10} color="#71717a" />
                              <span>{c.card_id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Verdict Badge */}
                      <td style={{ padding: '10px 14px' }}>
                        {isFraud ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: 'rgba(244, 63, 94, 0.15)',
                              color: '#f43f5e',
                              border: '1px solid rgba(244, 63, 94, 0.35)',
                              fontSize: '10.5px',
                              fontWeight: 800,
                            }}
                          >
                            {/* Live pulse radar */}
                            <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '6px', height: '6px' }}>
                              <motion.span
                                animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
                                style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#f43f5e' }}
                              />
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f43f5e' }} />
                            </span>
                            <span>FRAUD ({Math.round(c.fraud_probability * 100)}%)</span>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              fontSize: '10.5px',
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle size={10} />
                            <span>LEGITIMATE</span>
                          </div>
                        )}
                      </td>

                      {/* Typology */}
                      <td style={{ padding: '10px 14px', color: '#cbd5e1', fontSize: '11px' }}>
                        {c.pattern === 'none' ? (
                          <span style={{ color: '#71717a' }}>—</span>
                        ) : (
                          <span style={{ textTransform: 'capitalize' }}>
                            {c.pattern.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>

                      {/* Exposure */}
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span
                          className="mono"
                          style={{
                            fontWeight: 700,
                            fontSize: '12px',
                            color: c.exposure_usd > 0 ? '#f43f5e' : '#a1a1aa',
                          }}
                        >
                          ${c.exposure_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Recommended NBA */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="mono" style={{ fontWeight: 700, fontSize: '11px', color: '#f4f4f5' }}>
                            {primaryAction.action}
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: routeBg,
                              color: routeColor,
                              border: `1px solid ${routeColor}40`,
                            }}
                          >
                            {primaryAction.route}
                          </span>
                        </div>
                      </td>

                      {/* Action Button */}
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <motion.button
                          whileHover={{ scale: 1.03, backgroundColor: 'rgba(14, 165, 233, 0.15)', borderColor: 'rgba(14, 165, 233, 0.4)' }}
                          whileTap={{ scale: 0.97 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCase(c.case_id);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#f4f4f5',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ color: '#a1a1aa' }}>Inspect</span>
                          <ArrowRight size={11} color="#38bdf8" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '8px 14px',
            background: 'rgba(0, 0, 0, 0.45)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#71717a',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            Showing <strong style={{ color: '#f4f4f5' }}>{filteredCases.length}</strong> of{' '}
            <strong style={{ color: '#f4f4f5' }}>{totalCases}</strong> benchmark triage cases
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e' }} /> Confirmed Fraud ({fraudCases})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> Cleared Legitimate ({legitCases})
            </span>
          </div>
        </div>
      </div>

      {/* 5. Slide-Out Quick Case Preview Sheet */}
      <AnimatePresence>
        {selectedPreviewCase && (
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
              width: '420px',
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
                <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                  {selectedPreviewCase.case_id}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background:
                      selectedPreviewCase.verdict === 'fraud'
                        ? 'rgba(244, 63, 94, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                    color: selectedPreviewCase.verdict === 'fraud' ? '#f43f5e' : '#10b981',
                    border: `1px solid ${
                      selectedPreviewCase.verdict === 'fraud'
                        ? 'rgba(244, 63, 94, 0.35)'
                        : 'rgba(16, 185, 129, 0.35)'
                    }`,
                    textTransform: 'uppercase',
                  }}
                >
                  {selectedPreviewCase.verdict}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedPreviewCase(null)}
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
              {/* Verdict Summary Card */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#71717a' }}>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Calibrated Fraud Probability
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontWeight: 800,
                      color: selectedPreviewCase.verdict === 'fraud' ? '#f43f5e' : '#10b981',
                    }}
                  >
                    {selectedPreviewCase.verdict.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="mono" style={{ fontSize: '28px', fontWeight: 800, color: '#f4f4f5' }}>
                    {Math.round(selectedPreviewCase.fraud_probability * 100)}%
                  </span>
                  <span className="mono" style={{ fontSize: '11px', color: '#71717a' }}>
                    ({selectedPreviewCase.fraud_probability.toFixed(2)})
                  </span>
                </div>

                <div style={{ width: '100%', height: '5px', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(selectedPreviewCase.fraud_probability * 100)}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      height: '100%',
                      background: selectedPreviewCase.verdict === 'fraud' ? '#f43f5e' : '#10b981',
                    }}
                  />
                </div>
              </div>

              {/* Case Attributes Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
                  Case Core Identifiers
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ color: '#71717a', display: 'block', fontSize: '10px' }}>EXPOSURE</span>
                    <span className="mono" style={{ fontWeight: 800, color: selectedPreviewCase.exposure_usd > 0 ? '#f43f5e' : '#f4f4f5', fontSize: '13px' }}>
                      ${selectedPreviewCase.exposure_usd.toFixed(2)} USD
                    </span>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ color: '#71717a', display: 'block', fontSize: '10px' }}>TYPOLOGY</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#f4f4f5', fontSize: '11px', textTransform: 'capitalize' }}>
                      {selectedPreviewCase.pattern === 'none' ? 'Routine' : selectedPreviewCase.pattern.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ color: '#71717a', display: 'block', fontSize: '10px' }}>CUSTOMER ID</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#f4f4f5' }}>
                      {selectedPreviewCase.customer_id}
                    </span>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ color: '#71717a', display: 'block', fontSize: '10px' }}>PRIMARY CARD</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#f4f4f5' }}>
                      {selectedPreviewCase.card_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trigger Text Excerpt */}
              {selectedPreviewCase.trigger_text && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
                    Trigger Signal
                  </span>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: '11px',
                      color: '#d4d4d8',
                      lineHeight: 1.5,
                    }}
                  >
                    {selectedPreviewCase.trigger_text}
                  </div>
                </div>
              )}

              {/* Recommended Action Pill */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', fontWeight: 700 }}>
                  Agent Governed Action
                </span>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'rgba(14, 165, 233, 0.08)',
                    border: '1px solid rgba(14, 165, 233, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                    {selectedPreviewCase.final_actions?.[0]?.action || 'MONITOR_CARD'}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(14, 165, 233, 0.15)',
                      color: '#38bdf8',
                    }}
                  >
                    ROUTE: {selectedPreviewCase.final_actions?.[0]?.route || 'auto'}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
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
                  onOpenCase(selectedPreviewCase.case_id);
                  setSelectedPreviewCase(null);
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
                <span>Open Full Investigation for {selectedPreviewCase.case_id}</span>
                <ArrowRight size={13} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
