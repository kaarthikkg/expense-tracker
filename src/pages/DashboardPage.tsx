import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { PageShell } from '@/components/layout/PageShell';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { InsightFeed } from '@/components/dashboard/InsightFeed';
import { NetWorthPanel } from '@/components/dashboard/NetWorthPanel';
import { useNetWorth } from '@/hooks/useNetWorth';
import { AnimatedMetric } from '@/components/ui/AnimatedMetric';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { MerchantAvatar } from '@/components/expenses/MerchantAvatar';
import { useCurrency } from '@/hooks/useCurrency';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useGoalStore } from '@/store/goalStore';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import { formatDisplayDate, getMonthKey, shiftMonthKey } from '@/utils/dates';
import { isIncome } from '@/utils/transaction';

function SummaryStat({
  label,
  children,
  sub,
  delay = 0,
}: {
  label: string;
  children: ReactNode;
  sub?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="glass-panel rounded-2xl p-5"
    >
      <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">{label}</p>
      <div className="mt-2 font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
        {children}
      </div>
      {sub && <p className="mt-1.5 text-xs text-fg-secondary">{sub}</p>}
    </motion.div>
  );
}

export function DashboardPage() {
  const expenses = useExpenseStore((s) => s.expenses);
  const add = useExpenseStore((s) => s.add);
  const categories = useCategoryStore((s) => s.categories);
  const budgets = useBudgetStore((s) => s.budgets);
  const goals = useGoalStore((s) => s.goals);
  const paymentSources = usePaymentSourceStore((s) => s.paymentSources);
  const { format } = useCurrency();
  const [addOpen, setAddOpen] = useState(false);
  const currentMonthKey = getMonthKey();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const isCurrentMonth = selectedMonth === currentMonthKey;

  const m = useDashboardMetrics(expenses, categories, budgets, goals, selectedMonth);
  const netWorth = useNetWorth();
  const recent = expenses;
  const periodLabel = isCurrentMonth ? 'This month' : m.monthLabel;

  return (
    <PageShell
      title="Dashboard"
      subtitle={`${m.monthLabel} · cashflow & wealth`}
      action={
        <Button onClick={() => setAddOpen(true)} size="sm">
          + Log transaction
        </Button>
      }
    >
      <NetWorthPanel data={netWorth} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">
            Monthly insights
          </p>
          <p className="mt-0.5 text-sm font-semibold text-fg">{m.monthLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-label="Previous month"
            onClick={() => setSelectedMonth((prev) => shiftMonthKey(prev, -1))}
          >
            ← Prev
          </Button>
          <input
            type="month"
            aria-label="Select month"
            value={selectedMonth}
            max={currentMonthKey}
            onChange={(e) => {
              const next = e.target.value;
              if (next && next <= currentMonthKey) setSelectedMonth(next);
            }}
            className="rounded-lg border border-cockpit-border-strong bg-cockpit-panel px-3 py-1.5 text-sm text-fg outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/25 dark:bg-cockpit-elevated/80"
          />
          <Button
            variant="secondary"
            size="sm"
            aria-label="Next month"
            disabled={isCurrentMonth}
            onClick={() =>
              setSelectedMonth((prev) => {
                const next = shiftMonthKey(prev, 1);
                return next > currentMonthKey ? currentMonthKey : next;
              })
            }
          >
            Next →
          </Button>
          {!isCurrentMonth && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(currentMonthKey)}>
              This month
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat label="Spent" sub={`${periodLabel} · expenses only`} delay={0.05}>
          <span className="metric-glow text-fg">
            <AnimatedMetric value={m.monthTotal} />
          </span>
          {m.budgetRemaining !== null && (
            <div className="mt-4 border-t border-cockpit-border pt-4">
              <div className="mb-1 flex justify-between text-[11px] text-fg-muted">
                <span>Budget</span>
                <span>
                  {format(m.monthTotal)} / {format(m.monthTotal + m.budgetRemaining)}
                </span>
              </div>
              <ProgressBar value={m.monthTotal} max={m.monthTotal + m.budgetRemaining} />
              <p className="mt-1.5 text-[11px] text-fg-muted">
                {m.budgetRemaining >= 0
                  ? `${format(m.budgetRemaining)} remaining`
                  : `${format(-m.budgetRemaining)} over budget`}
              </p>
            </div>
          )}
        </SummaryStat>

        <SummaryStat label="Income" sub={periodLabel} delay={0.1}>
          <span className="text-success metric-glow">
            <AnimatedMetric value={m.monthIncome} />
          </span>
        </SummaryStat>

        <SummaryStat label="Net cash flow" sub="Income − expenses" delay={0.15}>
          <span
            className={`metric-glow ${m.netCashFlow >= 0 ? 'text-success' : 'text-danger'}`}
          >
            {m.netCashFlow >= 0 ? '+' : ''}
            {format(m.netCashFlow)}
          </span>
        </SummaryStat>

        <SummaryStat
          label="Savings goals"
          sub={goals.length > 0 ? 'Average progress' : 'No goals set'}
          delay={0.2}
        >
          <span className={goals.length > 0 ? 'text-success metric-glow' : 'text-fg-muted'}>
            {goals.length > 0 ? `${m.savingsMomentum}%` : '—'}
          </span>
        </SummaryStat>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Spending by category"
          subtitle={`Share of ${isCurrentMonth ? "this month's" : `${m.monthLabel}'s`} expenses`}
          delay={0.2}
        >
          <CategoryPieChart
            data={m.categoryBreakdown}
            monthKey={m.monthKey}
            height={240}
          />
        </DashboardSection>

        <DashboardSection
          title="Daily spending"
          subtitle={
            m.topCategoryName
              ? `Top category: ${m.topCategoryName} (${format(m.topCategoryTotal)})`
              : `Expense trend through ${isCurrentMonth ? 'the month' : m.monthLabel}`
          }
          delay={0.25}
        >
          <TrendAreaChart data={m.trend} height={240} />
        </DashboardSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <DashboardSection
          title="Insights"
          subtitle={
            isCurrentMonth
              ? 'Based on your recent activity'
              : `Insights for ${m.monthLabel}`
          }
          className="lg:col-span-2"
          delay={0.3}
        >
          <InsightFeed insights={m.insights} />
        </DashboardSection>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel flex flex-col rounded-2xl lg:col-span-3"
        >
          <div className="flex items-center justify-between border-b border-cockpit-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-fg">Recent transactions</h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                {recent.length} transaction{recent.length === 1 ? '' : 's'}, newest first
              </p>
            </div>
            <Link to="/expenses" className="text-xs font-medium text-accent hover:underline">
              View all →
            </Link>
          </div>
          <div className="max-h-[min(28rem,60vh)] divide-y divide-cockpit-border overflow-y-auto p-2">
            {recent.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-fg-muted">No transactions yet</p>
                <Button className="mt-4" size="sm" onClick={() => setAddOpen(true)}>
                  Log first transaction
                </Button>
              </div>
            ) : (
              recent.map((e) => {
                const cat = categories.find((c) => c.id === e.categoryId);
                const account = paymentSources.find((p) => p.id === e.paymentSourceId);
                const income = isIncome(e);
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-4 rounded-xl px-3 py-3 transition hover-surface"
                  >
                    <MerchantAvatar category={cat} description={e.description} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {e.description || 'Transaction'}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {income ? 'Income' : 'Expense'} · {cat?.name}
                        {account ? ` · ${account.name}` : ''} · {formatDisplayDate(e.date)}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-sm font-semibold ${income ? 'text-success' : ''}`}
                    >
                      {income ? '+' : ''}
                      {format(e.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>
      </div>

      <Modal open={addOpen} title="Log transaction" onClose={() => setAddOpen(false)}>
        <ExpenseForm
          onCancel={() => setAddOpen(false)}
          onSubmit={async (data) => {
            await add(data);
            setAddOpen(false);
          }}
        />
      </Modal>
    </PageShell>
  );
}
