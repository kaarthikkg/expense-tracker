import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { DataSourceBadge } from '@/components/sync/DataSourceBadge';
import { useExpenseStore } from '@/store/expenseStore';
import { FinancialBackground } from './FinancialBackground';
import {
  IconBudget,
  IconDashboard,
  IconMore,
  IconPlus,
  IconLoans,
  IconPortfolio,
  IconTransactions,
} from './NavIcons';

const sidebarNav = [
  { to: '/', label: 'Terminal', Icon: IconDashboard, end: true },
  { to: '/expenses', label: 'Flow', Icon: IconTransactions },
  { to: '/budgets', label: 'Burn', Icon: IconBudget },
  { to: '/portfolio', label: 'Portfolio', Icon: IconPortfolio },
  { to: '/loans', label: 'Loans', Icon: IconLoans },
  { to: '/reports', label: 'Analytics', Icon: IconTransactions },
  { to: '/categories', label: 'Categories', Icon: IconMore },
  { to: '/accounts', label: 'Cards & banks', Icon: IconMore },
  { to: '/goals', label: 'Momentum', Icon: IconBudget },
  { to: '/recurring', label: 'Recurring', Icon: IconTransactions },
  { to: '/settings', label: 'System', Icon: IconMore },
];

const mobileNav = [
  { to: '/', label: 'Home', Icon: IconDashboard, end: true },
  { to: '/expenses', label: 'Flow', Icon: IconTransactions },
  { to: '/budgets', label: 'Burn', Icon: IconBudget },
  { to: '/more', label: 'More', Icon: IconMore },
];

export function AppLayout() {
  const location = useLocation();
  const add = useExpenseStore((s) => s.add);
  const [fabOpen, setFabOpen] = useState(false);
  const showFab = !fabOpen && location.pathname !== '/settings';

  return (
    <div className="relative flex min-h-dvh w-full max-w-full overflow-x-clip">
      <FinancialBackground />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-cockpit-border bg-cockpit-panel/90 shadow-sm backdrop-blur-xl lg:flex dark:shadow-none">
        <div className="border-b border-cockpit-border px-5 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-accent shadow-lg shadow-accent/30">
              <span className="font-mono text-xs font-bold text-white">FC</span>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-fg">Finance</p>
              <p className="text-[10px] uppercase tracking-widest text-fg-muted">
                Command Center
              </p>
            </div>
          </div>
          <div className="mt-3">
            <DataSourceBadge />
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
          {sidebarNav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-accent-muted text-accent'
                    : 'text-fg-secondary hover:bg-surface-hover hover:text-fg'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="relative z-10 flex min-h-dvh min-w-0 w-full flex-1 flex-col lg:pl-60">
        <header className="page-pad flex items-center justify-between gap-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg">Finance</p>
            <p className="text-xs text-fg-muted">Command Center</p>
          </div>
          <DataSourceBadge compact />
        </header>

        <div className="page-pad min-w-0 flex-1 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pt-[var(--page-pad-y)] lg:pb-[var(--page-pad-y)]">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile / tablet bottom nav — sidebar only from lg up */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-cockpit-border bg-cockpit-panel/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden dark:shadow-none">
        <div className="mx-auto flex w-full max-w-lg items-stretch justify-around px-1">
          {mobileNav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[0.7rem] font-semibold leading-tight ${
                  isActive ? 'text-accent' : 'text-fg-muted'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {showFab && (
        <motion.button
          type="button"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setFabOpen(true)}
          className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent shadow-xl shadow-accent/35 lg:bottom-8 lg:right-8"
          aria-label="Add transaction"
        >
          <IconPlus className="h-7 w-7 text-white" />
        </motion.button>
      )}

      <Modal open={fabOpen} title="New transaction" onClose={() => setFabOpen(false)}>
        <ExpenseForm
          onCancel={() => setFabOpen(false)}
          onSubmit={async (data) => {
            await add(data);
            setFabOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
