import React from 'react';
import {
  LayoutDashboard,
  SearchCode,
  FolderGit2,
  Receipt,
  Network,
  ShieldAlert,
  FileClock,
  ChevronLeft,
  ChevronRight,
  Database,
  UserCheck,
} from 'lucide-react';

export type NavItem =
  | 'overview'
  | 'investigation'
  | 'cases'
  | 'transactions'
  | 'entities'
  | 'policies'
  | 'audit';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  stats?: {
    activeCasesCount: number;
    pendingApprovalsCount: number;
    sarCount: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  stats,
}) => {
  const navItems = [
    {
      id: 'overview' as NavItem,
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'investigation' as NavItem,
      label: 'Investigation',
      icon: SearchCode,
      badge: stats?.activeCasesCount ? `${stats.activeCasesCount}` : null,
      highlight: true,
    },
    {
      id: 'cases' as NavItem,
      label: 'Case Repository',
      icon: FolderGit2,
      badge: '20 Exam',
    },
    {
      id: 'transactions' as NavItem,
      label: 'Transactions',
      icon: Receipt,
      badge: '590K',
    },
    {
      id: 'entities' as NavItem,
      label: 'Entity Explorer',
      icon: Network,
      badge: null,
    },
    {
      id: 'policies' as NavItem,
      label: 'Fraud Policies',
      icon: ShieldAlert,
      badge: 'R1-R10',
    },
    {
      id: 'audit' as NavItem,
      label: 'Audit & Actions',
      icon: FileClock,
      badge: stats?.pendingApprovalsCount ? `${stats.pendingApprovalsCount} req` : null,
      badgeColor: 'amber',
    },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div
        style={{
          padding: '16px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid var(--border-default)',
          minHeight: '52px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: '0 0 12px rgba(14, 165, 233, 0.4)',
            flexShrink: 0,
          }}
        >
          TG
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              TIGER<span style={{ color: 'var(--brand-tiger)' }}>GRAPH</span>
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Agentic Fraud Ops
            </div>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '9px 0' : '8px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--bg-card-elevated)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: isActive ? 'var(--border-default)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon
                size={16}
                color={isActive ? 'var(--brand-tiger)' : 'var(--text-secondary)'}
                style={{ flexShrink: 0 }}
              />
              {!collapsed && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: isActive ? 600 : 500 }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                        background:
                          item.badgeColor === 'amber'
                            ? 'var(--risk-medium-bg)'
                            : isActive
                            ? 'var(--brand-tiger-glow)'
                            : 'var(--bg-tag)',
                        color:
                          item.badgeColor === 'amber'
                            ? 'var(--risk-medium)'
                            : isActive
                            ? 'var(--brand-tiger)'
                            : 'var(--text-muted)',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor:
                          item.badgeColor === 'amber'
                            ? 'var(--risk-medium-border)'
                            : isActive
                            ? 'rgba(14, 165, 233, 0.3)'
                            : 'var(--border-subtle)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status / Database Connection */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(7, 11, 19, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="live-dot" />
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={11} color="var(--brand-tiger)" /> FraudGraph (TG)
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                590K Txns • 7 Vertices
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analyst Profile & Collapse Toggle */}
      <div
        style={{
          padding: '12px 10px',
          borderTop: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                border: '1px solid var(--border-default)',
                flexShrink: 0,
              }}
            >
              <UserCheck size={14} color="#38bdf8" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                Sarah Lin
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Lead AML Investigator
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            background: 'var(--bg-card-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>
    </aside>
  );
};
