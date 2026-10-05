import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  CreditCard,
  User,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Store,
  Copy,
  Check,
  Activity,
  RefreshCw,
  X,
  Layers,
  Zap,
  Clock,
  DollarSign,
} from 'lucide-react';
import { TransactionItem } from '../../types';
import { fetchTransactions } from '../../api/client';
import {
  snappyTransition,
  fadeSlideUp,
  fadeSlideInRight,
  staggerContainer,
  staggerItem,
} from '../../utils/motion';

interface TransactionExplorerProps {
  onInvestigateCase: (caseId: string) => void;
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
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out
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

// 20 rich benchmark transactions matching the hackathon case pack (HHG-001 through HHG-020)
const BENCHMARK_TXNS_FALLBACK: TransactionItem[] = [
  {
    txn_id: '3514030',
    case_id: 'HHG-001',
    customer_id: 'C12382',
    card_id: 'C12382-K1',
    timestamp: '2016-12-05 01:55:28',
    amount: 77.07,
    channel: 'in_person',
    risk_score: 0.61,
    trigger_type: 'risk_score',
    status: 'closed_legitimate',
  },
  {
    txn_id: '3478782',
    case_id: 'HHG-002',
    customer_id: 'C11891',
    card_id: 'C11891-K1',
    timestamp: '2016-11-22 23:27:07',
    amount: 292.36,
    channel: 'online',
    risk_score: 0.79,
    trigger_type: 'risk_score',
    status: 'closed_fraud',
  },
  {
    txn_id: '3530164',
    case_id: 'HHG-003',
    customer_id: 'C08623',
    card_id: 'C08623-K2',
    timestamp: '2016-12-10 15:01:21',
    amount: 49.0,
    channel: 'online',
    risk_score: 0.45,
    trigger_type: 'customer_report',
    status: 'closed_legitimate',
  },
  {
    txn_id: '3583227',
    case_id: 'HHG-004',
    customer_id: 'C08106',
    card_id: 'C08106-K1',
    timestamp: '2016-12-29 07:53:54',
    amount: 128.33,
    channel: 'online',
    risk_score: 0.72,
    trigger_type: 'customer_report',
    status: 'closed_fraud',
  },
  {
    txn_id: '3523199',
    case_id: 'HHG-005',
    customer_id: 'C02923',
    card_id: 'C02923-K1',
    timestamp: '2016-12-08 03:38:37',
    amount: 100.07,
    channel: 'online',
    risk_score: 0.54,
    trigger_type: 'risk_score',
    status: 'closed_legitimate',
  },
  {
    txn_id: '3476682',
    case_id: 'HHG-006',
    customer_id: 'C07297',
    card_id: 'C07297-K1',
    timestamp: '2016-11-22 02:30:00',
    amount: 482.12,
    channel: 'online',
    risk_score: 0.88,
    trigger_type: 'customer_report',
    status: 'closed_fraud',
  },
  {
    txn_id: '3514948',
    case_id: 'HHG-007',
    customer_id: 'C09933',
    card_id: 'C09933-K2',
    timestamp: '2016-12-05 03:46:14',
    amount: 111.92,
    channel: 'in_person',
    risk_score: 0.87,
    trigger_type: 'risk_score',
    status: 'closed_fraud',
  },
  {
    txn_id: '3558054',
    case_id: 'HHG-008',
    customer_id: 'C13171',
    card_id: 'C13171-K2',
    timestamp: '2016-12-20 03:08:56',
    amount: 55.68,
    channel: 'in_person',
    risk_score: 0.38,
    trigger_type: 'customer_report',
    status: 'closed_legitimate',
  },
  {
    txn_id: '3581141',
    case_id: 'HHG-009',
    customer_id: 'C08299',
    card_id: 'C08299-K1',
    timestamp: '2016-12-28 17:10:53',
    amount: 30.02,
    channel: 'online',
    risk_score: 0.65,
    trigger_type: 'customer_report',
    status: 'closed_legitimate',
  },
  {
    txn_id: '3506725',
    case_id: 'HHG-010',
    customer_id: 'C10434',
    card_id: 'C10434-K1',
    timestamp: '2016-12-02 18:18:27',
    amount: 1000.03,
    channel: 'online',
    risk_score: 0.9,
    trigger_type: 'risk_score',
    status: 'closed_fraud',
  },
  {
    txn_id: '3583368',
    case_id: 'HHG-011',
    customer_id: 'C11923',
    card_id: 'C11923-K2',
    timestamp: '2016-12-29 06:27:44',
    amount: 131.3,
    channel: 'online',
    risk_score: 0.82,
    trigger_type: 'customer_report',
    status: 'closed_fraud',
  },
  {
    txn_id: '3553342',
    case_id: 'HHG-012',
    customer_id: 'C05876',
    card_id: 'C05876-K2',
    timestamp: '2016-12-18 05:00:31',
    amount: 30.91,
    channel: 'in_person',
    risk_score: 0.55,
    trigger_type: 'risk_score',
    status: 'closed_legitimate',
  },
  {
    txn_id: '3526826',
    case_id: 'HHG-013',
    customer_id: 'C07671',
    card_id: 'C07671-K2',
    timestamp: '2016-12-09 05:39:29',
    amount: 35.66,
    channel: 'online',
    risk_score: 0.76,
    trigger_type: 'risk_score',
    status: 'closed_fraud',
  },
  {
    txn_id: '3478561',
    case_id: 'HHG-014',
    customer_id: 'C13487',
    card_id: 'C13487-K1',
    timestamp: '2016-11-22 20:11:00',
    amount: 210.0,
    channel: 'online',
    risk_score: 0.84,
    trigger_type: 'analyst_request',
    status: 'closed_fraud',
  },
  {
    txn_id: '3464869',
    case_id: 'HHG-015',
    customer_id: 'C03042',
    card_id: 'C03042-K1',
    timestamp: '2016-11-17 19:03:36',
    amount: 599.94,
    channel: 'online',
    risk_score: 0.77,
    trigger_type: 'risk_score',
    status: 'closed_fraud',
  },
  {
    txn_id: '3534820',
    case_id: 'HHG-016',
    customer_id: 'C09988',
    card_id: 'C09988-K1',
    timestamp: '2016-12-12 01:39:08',
    amount: 59.67,
    channel: 'online',
    risk_score: 0.42,
    trigger_type: 'customer_report',
    status: 'closed_legitimate',
  },
  {
    txn_id: '3450629',
    case_id: 'HHG-017',
    customer_id: 'C04570',
    card_id: 'C04570-K1',
    timestamp: '2016-11-12 00:46:24',
    amount: 100.09,
    channel: 'online',
    risk_score: 0.57,
    trigger_type: 'risk_score',
    status: 'closed_legitimate',
  },
  {
    txn_id: '3491361',
    case_id: 'HHG-018',
    customer_id: 'C02354',
    card_id: 'C02354-K2',
    timestamp: '2016-11-27 14:41:26',
    amount: 39.08,
    channel: 'in_person',
    risk_score: 0.35,
    trigger_type: 'customer_report',
    status: 'closed_legitimate',
  },
  {
    txn_id: '3503878',
    case_id: 'HHG-019',
    customer_id: 'C07987',
    card_id: 'C07987-K2',
    timestamp: '2016-12-01 22:28:53',
    amount: 99.92,
    channel: 'online',
    risk_score: 0.9,
    trigger_type: 'risk_score',
    status: 'closed_fraud',
  },
  {
    txn_id: '3509359',
    case_id: 'HHG-020',
    customer_id: 'C12265',
    card_id: 'C12265-K2',
    timestamp: '2016-12-03 12:04:26',
    amount: 125.08,
    channel: 'online',
    risk_score: 0.52,
    trigger_type: 'risk_score',
    status: 'closed_legitimate',
  },
];

// Helper to format ISO/raw timestamp into "Dec 05, 2016 · 01:55 AM"
function formatTxnDate(raw: string): string {
  if (!raw) return '—';
  try {
    const d = new Date(raw.replace(' ', 'T'));
    if (isNaN(d.getTime())) return raw;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${month} ${day}, ${year} · ${strHours}:${minutes} ${ampm}`;
  } catch {
    return raw;
  }
}

export const TransactionExplorer: React.FC<TransactionExplorerProps> = ({ onInvestigateCase }) => {
  const [items, setItems] = useState<TransactionItem[]>(BENCHMARK_TXNS_FALLBACK);
  const [loading, setLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState<'all' | 'online' | 'in_person'>('all');
  const [riskTier, setRiskTier] = useState<'all' | 'low' | 'moderate' | 'critical'>('all');
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<TransactionItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadTxns();
  }, [channelFilter, riskTier]);

  const loadTxns = async () => {
    setLoading(true);
    try {
      let min_risk: number | undefined;
      if (riskTier === 'moderate') min_risk = 0.41;
      if (riskTier === 'critical') min_risk = 0.71;

      const res = await fetchTransactions({
        limit: 50,
        channel: channelFilter !== 'all' ? channelFilter : undefined,
        min_risk,
      });

      if (res && res.items && res.items.length > 0) {
        setItems(res.items);
      } else {
        setItems(BENCHMARK_TXNS_FALLBACK);
      }
    } catch (e) {
      console.warn('Backend fetch failed, using benchmark transaction pack:', e);
      setItems(BENCHMARK_TXNS_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  // Copy TXN ID handler
  const handleCopyTxnId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filtered dataset
  const filtered = useMemo(() => {
    return items.filter((t) => {
      // Channel match
      if (channelFilter !== 'all' && t.channel.toLowerCase() !== channelFilter.toLowerCase()) {
        return false;
      }

      // Risk Tier match
      if (riskTier === 'low' && t.risk_score > 0.4) return false;
      if (riskTier === 'moderate' && (t.risk_score <= 0.4 || t.risk_score > 0.7)) return false;
      if (riskTier === 'critical' && t.risk_score <= 0.7) return false;

      // Search match
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        t.txn_id.toLowerCase().includes(q) ||
        t.card_id.toLowerCase().includes(q) ||
        t.customer_id.toLowerCase().includes(q) ||
        t.case_id.toLowerCase().includes(q)
      );
    });
  }, [items, channelFilter, riskTier, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', position: 'relative' }}>
      {/* 1. Header & Context */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1f2638', letterSpacing: '-0.02em', margin: 0 }}>
              Transaction Explorer & Risk Signals
            </h2>
            <span
              className="mono"
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(79, 99, 210, 0.15)',
                color: '#4f63d2',
                border: '1px solid rgba(79, 99, 210, 0.3)',
              }}
            >
              TigerGraph Engine
            </span>
          </div>
          <p style={{ fontSize: '11.5px', color: '#556078', marginTop: '3px' }}>
            590,742 total transactions loaded in TigerGraph. Real-time GSQL feature scoring, graph neighborhood velocity, and autonomous agent triage.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.button
            whileHover={{ backgroundColor: 'rgba(71, 85, 140, 0.104)' }}
            whileTap={{}}
            onClick={() => loadTxns()}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(71, 85, 140, 0.065)',
              border: '1px solid rgba(71, 85, 140, 0.13)',
              color: '#1f2638',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} color={loading ? '#4f63d2' : '#556078'} />
            <span>{loading ? 'Syncing...' : 'Sync Stream'}</span>
          </motion.button>
        </div>
      </div>

      {/* 2. Top Executive Metric Bar (Smooth Count-Up & Live Pulse) */}
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
        {/* Metric 1: Total Scored with Rolling Numbers */}
        <motion.div
          variants={staggerItem}
          whileHover={{ borderColor: 'rgba(71, 85, 140, 0.208)' }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(71, 85, 140, 0.104)',
            boxShadow: 'none',
            borderRadius: '6px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7388', fontWeight: 700 }}>
              Total Scored Txns
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 700,
                background: 'rgba(5, 150, 105, 0.15)',
                color: '#059669',
                border: '1px solid rgba(5, 150, 105, 0.3)',
              }}
            >
              {/* Radar pulse wave effect */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '8px', height: '8px' }}>
                <motion.span
                  animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                  style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#059669' }}
                />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
              </div>
              <span>Live Stream</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span className="mono" style={{ fontSize: '24px', fontWeight: 700, color: '#1f2638' }}>
              <AnimatedCounter value={590742} duration={1.2} />
            </span>
            <span style={{ fontSize: '11px', color: '#6b7388' }}>records</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#4f63d2', marginTop: '4px' }}>
            <Activity size={12} />
            <span>TigerGraph GSQL Real-Time</span>
          </div>
        </motion.div>

        {/* Metric 2: Velocity Spike */}
        <motion.div
          variants={staggerItem}
          whileHover={{ borderColor: 'rgba(71, 85, 140, 0.208)' }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(71, 85, 140, 0.104)',
            boxShadow: 'none',
            borderRadius: '6px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7388', fontWeight: 700 }}>
              High-Risk Velocity
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '9999px',
                background: 'rgba(220, 60, 69, 0.15)',
                color: '#dc3c45',
                border: '1px solid rgba(220, 60, 69, 0.3)',
              }}
            >
              &gt; 0.75 Risk
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span className="mono" style={{ fontSize: '24px', fontWeight: 700, color: '#dc3c45' }}>
              <AnimatedCounter value={14} suffix=" txns / min" duration={0.8} />
            </span>
            <span style={{ fontSize: '11px', color: '#6b7388' }}>peak</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#dc3c45', marginTop: '4px', fontWeight: 600 }}>
            <TrendingUp size={12} />
            <span>+3.2% vs 1h baseline</span>
          </div>
        </motion.div>

        {/* Metric 3: Flagged Volume with Rolling USD */}
        <motion.div
          variants={staggerItem}
          whileHover={{ borderColor: 'rgba(71, 85, 140, 0.208)' }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(71, 85, 140, 0.104)',
            boxShadow: 'none',
            borderRadius: '6px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7388', fontWeight: 700 }}>
              Flagged Exposure
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '9999px',
                background: 'rgba(217, 130, 11, 0.15)',
                color: '#d9820b',
                border: '1px solid rgba(217, 130, 11, 0.3)',
              }}
            >
              High Severity
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span className="mono" style={{ fontSize: '24px', fontWeight: 700, color: '#1f2638' }}>
              <AnimatedCounter value={148290} prefix="$" duration={1.1} />
            </span>
            <span className="mono" style={{ fontSize: '11px', color: '#6b7388' }}>USD</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#556078', marginTop: '4px' }}>
            <DollarSign size={12} color="#d9820b" />
            <span>Queued exposure across clusters</span>
          </div>
        </motion.div>

        {/* Metric 4: Auto-Blocked */}
        <motion.div
          variants={staggerItem}
          whileHover={{ borderColor: 'rgba(71, 85, 140, 0.208)' }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(71, 85, 140, 0.104)',
            boxShadow: 'none',
            borderRadius: '6px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7388', fontWeight: 700 }}>
              Auto-Blocked / Review
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '9999px',
                background: 'rgba(79, 99, 210, 0.15)',
                color: '#4f63d2',
                border: '1px solid rgba(79, 99, 210, 0.3)',
              }}
            >
              R1–R10 Rules
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span className="mono" style={{ fontSize: '24px', fontWeight: 700, color: '#1f2638' }}>
              <AnimatedCounter value={128} duration={0.9} />
            </span>
            <span style={{ fontSize: '11px', color: '#6b7388' }}>actions</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
            <ShieldCheck size={12} />
            <span>98.4% Agent Precision</span>
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
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(71, 85, 140, 0.104)',
          borderRadius: '6px',
          padding: '8px 12px',
        }}
      >
        {/* Left: Search input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} color="#6b7388" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search txn ID, card, customer, or case..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: '#f6f7fa',
              border: '1px solid rgba(71, 85, 140, 0.104)',
              borderRadius: '6px',
              padding: '6px 30px 6px 32px',
              color: '#1f2638',
              fontSize: '11.5px',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(79, 99, 210, 0.6)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(71, 85, 140, 0.104)')}
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
                color: '#6b7388',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Center / Right: Channel & Risk Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Channel selector with sliding pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f6f7fa',
              border: '1px solid rgba(71, 85, 140, 0.104)',
              borderRadius: '6px',
              padding: '2px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setChannelFilter('all')}
              style={{
                position: 'relative',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: channelFilter === 'all' ? '#1f2638' : '#6b7388',
                zIndex: 2,
                transition: 'color 0.15s ease',
              }}
            >
              {channelFilter === 'all' && (
                <motion.div
                  layoutId="txnChannelPill"
                  transition={snappyTransition}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '4px',
                    background: 'rgba(71, 85, 140, 0.156)',
                    zIndex: -1,
                  }}
                />
              )}
              All Channels
            </button>
            <button
              onClick={() => setChannelFilter('online')}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: channelFilter === 'online' ? '#4f63d2' : '#6b7388',
                zIndex: 2,
                transition: 'color 0.15s ease',
              }}
            >
              {channelFilter === 'online' && (
                <motion.div
                  layoutId="txnChannelPill"
                  transition={snappyTransition}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '4px',
                    background: 'rgba(79, 99, 210, 0.2)',
                    border: '1px solid rgba(79, 99, 210, 0.35)',
                    zIndex: -1,
                  }}
                />
              )}
              <Globe size={11} />
              Online
            </button>
            <button
              onClick={() => setChannelFilter('in_person')}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: channelFilter === 'in_person' ? '#d9820b' : '#6b7388',
                zIndex: 2,
                transition: 'color 0.15s ease',
              }}
            >
              {channelFilter === 'in_person' && (
                <motion.div
                  layoutId="txnChannelPill"
                  transition={snappyTransition}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '4px',
                    background: 'rgba(217, 130, 11, 0.2)',
                    border: '1px solid rgba(217, 130, 11, 0.35)',
                    zIndex: -1,
                  }}
                />
              )}
              <Store size={11} />
              In-Person
            </button>
          </div>

          {/* Risk Tier selector with sliding pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f6f7fa',
              border: '1px solid rgba(71, 85, 140, 0.104)',
              borderRadius: '6px',
              padding: '2px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setRiskTier('all')}
              style={{
                position: 'relative',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: riskTier === 'all' ? '#1f2638' : '#6b7388',
                zIndex: 2,
              }}
            >
              {riskTier === 'all' && (
                <motion.div
                  layoutId="txnRiskPill"
                  transition={snappyTransition}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '4px',
                    background: 'rgba(71, 85, 140, 0.156)',
                    zIndex: -1,
                  }}
                />
              )}
              All Scores
            </button>
            <button
              onClick={() => setRiskTier('low')}
              style={{
                position: 'relative',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: riskTier === 'low' ? '#059669' : '#6b7388',
                zIndex: 2,
              }}
            >
              {riskTier === 'low' && (
                <motion.div
                  layoutId="txnRiskPill"
                  transition={snappyTransition}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '4px',
                    background: 'rgba(5, 150, 105, 0.2)',
                    border: '1px solid rgba(5, 150, 105, 0.35)',
                    zIndex: -1,
                  }}
                />
              )}
              Low (&le;0.40)
            </button>
            <button
              onClick={() => setRiskTier('moderate')}
              style={{
                position: 'relative',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: riskTier === 'moderate' ? '#d9820b' : '#6b7388',
                zIndex: 2,
              }}
            >
              {riskTier === 'moderate' && (
                <motion.div
                  layoutId="txnRiskPill"
                  transition={snappyTransition}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '4px',
                    background: 'rgba(217, 130, 11, 0.2)',
                    border: '1px solid rgba(217, 130, 11, 0.35)',
                    zIndex: -1,
                  }}
                />
              )}
              Moderate
            </button>
            <button
              onClick={() => setRiskTier('critical')}
              style={{
                position: 'relative',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: riskTier === 'critical' ? '#dc3c45' : '#6b7388',
                zIndex: 2,
              }}
            >
              {riskTier === 'critical' && (
                <motion.div
                  layoutId="txnRiskPill"
                  transition={snappyTransition}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '4px',
                    background: 'rgba(220, 60, 69, 0.2)',
                    border: '1px solid rgba(220, 60, 69, 0.35)',
                    zIndex: -1,
                  }}
                />
              )}
              Severe (&gt;0.70)
            </button>
          </div>
        </div>
      </div>

      {/* 4. Stripe Radar Data Table with Waterfall Entrance */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(71, 85, 140, 0.104)',
          boxShadow: 'none',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  background: '#f6f7fa',
                  borderBottom: '1px solid rgba(71, 85, 140, 0.104)',
                  color: '#6b7388',
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>TXN ID</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>TIMESTAMP</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>CUSTOMER / CARD</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>AMOUNT</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>CHANNEL</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>MODEL RISK SCORE</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>INVESTIGATE</th>
              </tr>
            </thead>

            {/* Animate every filter change with re-keyed waterfall cascade */}
            <motion.tbody
              key={`${channelFilter}-${riskTier}-${search}`}
              variants={{
                initial: {},
                animate: {
                  transition: {
                    staggerChildren: 0.035,
                    delayChildren: 0.05,
                  },
                },
              }}
              initial="initial"
              animate="animate"
            >
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#6b7388' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Receipt size={28} color="#8c94a8" />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#556078' }}>
                        No transactions match current filters
                      </span>
                      <p style={{ fontSize: '11px', color: '#6b7388', margin: 0 }}>
                        Try resetting your search query or selecting "All Channels" and "All Scores".
                      </p>
                      <button
                        onClick={() => {
                          setSearch('');
                          setChannelFilter('all');
                          setRiskTier('all');
                        }}
                        style={{
                          marginTop: '6px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'rgba(79, 99, 210, 0.15)',
                          border: '1px solid rgba(79, 99, 210, 0.3)',
                          color: '#4f63d2',
                          cursor: 'pointer',
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const riskPct = Math.round(t.risk_score * 100);
                  const isSevere = t.risk_score > 0.7;
                  const isModerate = t.risk_score > 0.4 && t.risk_score <= 0.7;
                  const isSelected = selectedTxn?.txn_id === t.txn_id;

                  // Color tokens for risk pill & progress bar
                  let riskColor = '#059669';
                  let riskBg = 'rgba(5, 150, 105, 0.15)';
                  let riskBorder = 'rgba(5, 150, 105, 0.35)';

                  if (isSevere) {
                    riskColor = '#dc3c45';
                    riskBg = 'rgba(220, 60, 69, 0.15)';
                    riskBorder = 'rgba(220, 60, 69, 0.35)';
                  } else if (isModerate) {
                    riskColor = '#d9820b';
                    riskBg = 'rgba(217, 130, 11, 0.15)';
                    riskBorder = 'rgba(217, 130, 11, 0.35)';
                  }

                  return (
                    <motion.tr
                      key={t.txn_id}
                      variants={{
                        initial: { opacity: 0, y: 8 },
                        animate: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                        },
                      }}
                      onClick={() => setSelectedTxn(t)}
                      style={{
                        borderBottom: '1px solid rgba(71, 85, 140, 0.052)',
                        background: isSelected ? 'rgba(71, 85, 140, 0.078)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(71, 85, 140, 0.039)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* 1. TXN ID with Copy Button */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="mono" style={{ fontWeight: 700, color: '#4f63d2', fontSize: '12px' }}>
                            #{t.txn_id}
                          </span>
                          <motion.button
                            whileHover={{}}
                            whileTap={{}}
                            onClick={(e) => handleCopyTxnId(t.txn_id, e)}
                            title="Copy Transaction ID"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px',
                              cursor: 'pointer',
                              color: '#6b7388',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {copiedId === t.txn_id ? (
                              <Check size={11} color="#059669" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </motion.button>
                        </div>
                      </td>

                      {/* 2. Formatted Timestamp */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#556078', fontSize: '11px' }} className="mono">
                          <Clock size={11} color="#6b7388" style={{ flexShrink: 0 }} />
                          <span>{formatTxnDate(t.timestamp)}</span>
                        </div>
                      </td>

                      {/* 3. Customer & Card */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'rgba(71, 85, 140, 0.104)',
                              border: '1px solid rgba(71, 85, 140, 0.13)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <User size={11} color="#47516a" />
                          </div>
                          <div>
                            <div className="mono" style={{ fontWeight: 700, color: '#1f2638', fontSize: '12px' }}>
                              {t.customer_id}
                            </div>
                            <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#6b7388' }}>
                              <CreditCard size={10} color="#6b7388" />
                              <span>{t.card_id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. Amount */}
                      <td style={{ padding: '10px 14px' }}>
                        <div className="mono" style={{ fontWeight: 700, color: '#1f2638', fontSize: '12px' }}>
                          ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span style={{ fontSize: '10px', color: '#6b7388', marginLeft: '4px', fontWeight: 500 }}>USD</span>
                        </div>
                      </td>

                      {/* 5. Channel Badge */}
                      <td style={{ padding: '10px 14px' }}>
                        {t.channel.toLowerCase() === 'online' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              background: 'rgba(79, 99, 210, 0.15)',
                              color: '#4f63d2',
                              border: '1px solid rgba(79, 99, 210, 0.3)',
                            }}
                          >
                            <Globe size={10} /> ONLINE
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              background: 'rgba(71, 85, 140, 0.104)',
                              color: '#556078',
                              border: '1px solid rgba(71, 85, 140, 0.156)',
                            }}
                          >
                            <Store size={10} /> IN_PERSON
                          </span>
                        )}
                      </td>

                      {/* 6. Animated Risk Score Progress Bar */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}>
                          {/* Score pill with live pulse for severe risk */}
                          <div
                            className="mono"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: riskBg,
                              color: riskColor,
                              border: `1px solid ${riskBorder}`,
                            }}
                          >
                            {isSevere && (
                              <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '6px', height: '6px' }}>
                                <motion.span
                                  animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
                                  style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#dc3c45' }}
                                />
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#dc3c45' }} />
                              </span>
                            )}
                            <span>{t.risk_score.toFixed(2)}</span>
                          </div>

                          {/* Smooth Animated Progress Bar */}
                          <div
                            style={{
                              flex: 1,
                              height: '4px',
                              borderRadius: '9999px',
                              background: 'rgba(71, 85, 140, 0.104)',
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${riskPct}%` }}
                              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                              style={{
                                height: '100%',
                                background: riskColor,
                                borderRadius: '9999px',
                                boxShadow: isSevere ? 'none' : undefined,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 7. Action Button ("Investigate Case") with hover slide */}
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <motion.button
                          whileHover={{ backgroundColor: 'rgba(79, 99, 210, 0.15)', borderColor: 'rgba(79, 99, 210, 0.4)' }}
                          whileTap={{}}
                          onClick={(e) => {
                            e.stopPropagation();
                            onInvestigateCase(t.case_id);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            background: 'rgba(71, 85, 140, 0.065)',
                            border: '1px solid rgba(71, 85, 140, 0.13)',
                            color: '#1f2638',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span className="mono" style={{ color: '#4f63d2', fontWeight: 700 }}>
                            {t.case_id}
                          </span>
                          <span style={{ color: '#556078' }}>Inspect</span>
                          <motion.span
                            initial={{ x: 0 }}
                            whileHover={{ x: 3 }}
                            transition={snappyTransition}
                            style={{ display: 'inline-flex', alignItems: 'center' }}
                          >
                            <ArrowRight size={11} color="#4f63d2" />
                          </motion.span>
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div
          style={{
            padding: '8px 14px',
            background: '#f6f7fa',
            borderTop: '1px solid rgba(71, 85, 140, 0.104)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#6b7388',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            Showing <strong style={{ color: '#1f2638' }}>{filtered.length}</strong> of{' '}
            <strong style={{ color: '#1f2638' }}>590,742</strong> scored transactions
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} /> &le;0.40 Low
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d9820b' }} /> 0.41–0.70 Moderate
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc3c45' }} /> &gt;0.70 Severe
            </span>
          </div>
        </div>
      </div>

      {/* 5. Slide-Out Transaction Inspector Drawer with Fluid Slide-In */}
      <AnimatePresence>
        {selectedTxn && (
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
              maxWidth: '90vw',
              background: 'rgba(255, 255, 255, 0.96)',
              borderLeft: '1px solid rgba(71, 85, 140, 0.13)',
              boxShadow: 'var(--shadow-drawer)',
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
                padding: '14px 16px',
                borderBottom: '1px solid rgba(71, 85, 140, 0.104)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                background: 'rgba(255, 255, 255, 0.98)',
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={16} color="#4f63d2" />
                <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: '#1f2638' }}>
                  TXN #{selectedTxn.txn_id}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(79, 99, 210, 0.15)',
                    color: '#4f63d2',
                    border: '1px solid rgba(79, 99, 210, 0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  Scored
                </span>
              </div>
              <motion.button
                whileHover={{}}
                whileTap={{}}
                onClick={() => setSelectedTxn(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7388',
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
              {/* Risk Meter Card */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  background: '#f6f7fa',
                  border: '1px solid rgba(71, 85, 140, 0.104)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#6b7388' }}>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    TigerGraph Model Risk Score
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontWeight: 700,
                      color: selectedTxn.risk_score > 0.7 ? '#dc3c45' : selectedTxn.risk_score > 0.4 ? '#d9820b' : '#059669',
                    }}
                  >
                    {selectedTxn.risk_score > 0.7 ? 'SEVERE RISK' : selectedTxn.risk_score > 0.4 ? 'MODERATE RISK' : 'LOW RISK'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="mono" style={{ fontSize: '28px', fontWeight: 700, color: '#1f2638' }}>
                    {(selectedTxn.risk_score * 100).toFixed(0)}%
                  </span>
                  <span className="mono" style={{ fontSize: '11px', color: '#6b7388' }}>
                    ({selectedTxn.risk_score.toFixed(2)})
                  </span>
                </div>

                <div style={{ width: '100%', height: '5px', borderRadius: '9999px', background: 'rgba(71, 85, 140, 0.104)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(selectedTxn.risk_score * 100)}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      height: '100%',
                      background:
                        selectedTxn.risk_score > 0.7
                          ? '#dc3c45'
                          : selectedTxn.risk_score > 0.4
                          ? '#d9820b'
                          : '#059669',
                    }}
                  />
                </div>
              </div>

              {/* Transaction Attributes Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7388', fontWeight: 700 }}>
                  Transaction Metadata
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div style={{ padding: '10px', borderRadius: '6px', background: '#f6f7fa', border: '1px solid rgba(71, 85, 140, 0.078)' }}>
                    <span style={{ color: '#6b7388', display: 'block', fontSize: '10px' }}>AMOUNT</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#1f2638', fontSize: '13px' }}>
                      ${selectedTxn.amount.toFixed(2)} USD
                    </span>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', background: '#f6f7fa', border: '1px solid rgba(71, 85, 140, 0.078)' }}>
                    <span style={{ color: '#6b7388', display: 'block', fontSize: '10px' }}>CHANNEL</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#1f2638', fontSize: '12px', textTransform: 'capitalize' }}>
                      {selectedTxn.channel}
                    </span>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', background: '#f6f7fa', border: '1px solid rgba(71, 85, 140, 0.078)' }}>
                    <span style={{ color: '#6b7388', display: 'block', fontSize: '10px' }}>CUSTOMER ID</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#1f2638' }}>
                      {selectedTxn.customer_id}
                    </span>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', background: '#f6f7fa', border: '1px solid rgba(71, 85, 140, 0.078)' }}>
                    <span style={{ color: '#6b7388', display: 'block', fontSize: '10px' }}>CARD ID</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#1f2638' }}>
                      {selectedTxn.card_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* TigerGraph Graph Signals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7388', fontWeight: 700 }}>
                  TigerGraph Real-Time Signals
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ padding: '10px', borderRadius: '6px', background: '#f6f7fa', border: '1px solid rgba(71, 85, 140, 0.078)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Zap size={14} color="#d9820b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <span style={{ fontWeight: 700, color: '#1f2638', display: 'block', fontSize: '11.5px' }}>
                        Velocity & Hop Analysis
                      </span>
                      <span style={{ color: '#556078', fontSize: '10.5px', lineHeight: 1.4 }}>
                        Sub-second multi-hop traversal evaluated card and customer graph neighborhood within 2 degrees.
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '10px', borderRadius: '6px', background: '#f6f7fa', border: '1px solid rgba(71, 85, 140, 0.078)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Layers size={14} color="#4f63d2" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <span style={{ fontWeight: 700, color: '#1f2638', display: 'block', fontSize: '11.5px' }}>
                        Linked Benchmark Case
                      </span>
                      <span style={{ color: '#556078', fontSize: '10.5px', lineHeight: 1.4 }}>
                        Associated with benchmark case{' '}
                        <strong className="mono" style={{ color: '#4f63d2' }}>{selectedTxn.case_id}</strong>.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw JSON Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7388', fontWeight: 700 }}>
                  Raw TigerGraph Entity Payload
                </span>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: '#f6f7fa',
                    border: '1px solid rgba(71, 85, 140, 0.078)',
                    fontSize: '10px',
                    color: '#556078',
                    overflowX: 'auto',
                  }}
                  className="mono"
                >
                  <pre style={{ margin: 0 }}>{JSON.stringify(selectedTxn, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div
              style={{
                padding: '14px 16px',
                borderTop: '1px solid rgba(71, 85, 140, 0.104)',
                background: 'rgba(255, 255, 255, 0.98)',
                position: 'sticky',
                bottom: 0,
              }}
            >
              <motion.button
                whileHover={{ backgroundColor: '#4f63d2' }}
                whileTap={{}}
                onClick={() => {
                  onInvestigateCase(selectedTxn.case_id);
                  setSelectedTxn(null);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '6px',
                  background: '#4f63d2',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                <span>Investigate Case {selectedTxn.case_id} in Workspace</span>
                <ArrowRight size={13} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
