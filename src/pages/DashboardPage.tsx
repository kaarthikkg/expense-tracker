import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { PageShell } from '@/components/layout/PageShell';
import { WidgetPanel } from '@/components/dashboard/WidgetPanel';
import { HealthScoreWidget } from '@/components/dashboard/HealthScoreWidget';
import { InsightFeed } from '@/components/dashboard/InsightFeed';
import { AnimatedMetric } from '@/components/ui/AnimatedMetric';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { CategoryBarsChart } from '@/components/charts/CategoryBarsChart';
import { MerchantAvatar } from '@/components/expenses/MerchantAvatar';
import { useCurrency } from '@/hooks/useCurrency';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useGoalStore } from '@/store/goalStore';
import { formatDisplayDate } from '@/utils/dates';
import { isIncome } from '@/utils/transaction';

export function DashboardPage() {
  const expenses = useExpenseStore((s) => s.expenses);
  const add = useExpenseStore((s) => s.add);
  const categories = useCategoryStore((s) => s.categories);
  const budgets = useBudgetStore((s) => s.budgets);
  const goals = useGoalStore((s) => s.goals);
  const { format } = useCurrency();
  const [addOpen, setAddOpen] = useState(false);

  const m = useDashboardMetrics(expenses, categories, budgets, goals);
  const recent = expenses.slice(0, 5);

  return (
    <PageShell
      title="Financial Terminal"
      subtitle="Real-time personal finance command center"
      action={
        <Button onClick={() => setAddOpen(true)} size="sm">
          + Log transaction
        </Button>
      }
    >
      <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
        <WidgetPanel label="Financial Health" delay={0}>
          <HealthScoreWidget score={m.healthScore} />
        </WidgetPanel>

        <WidgetPanel label="Spending Velocity" delay={0.05}>
          <p className="font-mono text-3xl font-bold tracking-tight metric-glow">
            {m.velocityDirection === 'up' ? '+' : m.velocityDirection === 'down' ? '−' : ''}
            {m.spendingVelocity}%
          </p>
          <p className="mt-2 text-xs text-fg-secondary">
            Today vs 7-day average
          </p>
          <p
            className={`mt-4 text-sm font-medium ${
              m.velocityDirection === 'up'
                ? 'text-warning'
                : m.velocityDirection === 'down'
                  ? 'text-success'
                  : 'text-fg-muted'
            }`}
          >
            {m.velocityDirection === 'up'
              ? 'Accelerating spend'
              : m.velocityDirection === 'down'
                ? 'Cooling down'
                : 'Stable velocity'}
          </p>
        </WidgetPanel>

        <WidgetPanel label="Monthly Burn Rate" delay={0.1}>
          <p className="text-xs text-fg-muted">Daily average</p>
          <p className="mt-1 font-mono text-2xl font-semibold">
            <AnimatedMetric value={m.burnRate} />
          </p>
          <p className="mt-4 text-xs text-fg-muted">Projected month-end</p>
          <p className="font-mono text-lg text-warning">{format(m.projectedMonth)}</p>
        </WidgetPanel>

        <WidgetPanel label="Savings Momentum" delay={0.15}>
          <p className="font-mono text-4xl font-bold text-success metric-glow">{m.savingsMomentum}%</p>
          <p className="mt-2 text-xs text-fg-secondary">
            Aggregate goal progress
          </p>
        </WidgetPanel>

        <WidgetPanel label="Income this month" delay={0.16}>
          <p className="font-mono text-3xl font-bold text-success metric-glow">
            <AnimatedMetric value={m.monthIncome} />
          </p>
          <p className="mt-2 text-xs text-fg-secondary">
            Logged inflows
          </p>
        </WidgetPanel>

        <WidgetPanel label="Net cash flow" delay={0.17}>
          <p
            className={`font-mono text-3xl font-bold metric-glow ${
              m.netCashFlow >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {m.netCashFlow >= 0 ? '+' : ''}
            {format(m.netCashFlow)}
          </p>
          <p className="mt-2 text-xs text-fg-secondary">
            Income minus expenses
          </p>
        </WidgetPanel>

        <WidgetPanel label="Top Spending Trend" span="wide" delay={0.2}>
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <p className="text-lg font-semibold">{m.topCategoryName ?? '—'}</p>
              <p className="text-xs text-fg-muted">Leading category this month</p>
            </div>
            {m.topCategoryName && (
              <p className="font-mono text-xl font-semibold text-accent">
                {format(m.topCategoryTotal)}
              </p>
            )}
          </div>
          <TrendAreaChart data={m.trend} height={200} />
        </WidgetPanel>

        <WidgetPanel label="Capital Flow by Category" delay={0.25}>
          <CategoryBarsChart data={m.categoryBreakdown} />
        </WidgetPanel>

        <WidgetPanel label="Smart Insight Feed" span="wide" delay={0.3}>
          <InsightFeed insights={m.insights} />
        </WidgetPanel>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-panel mt-6 rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-cockpit-border px-5 py-4">
          <p className="text-sm font-semibold">Live transaction stream</p>
          <Link to="/expenses" className="text-xs font-medium text-accent hover:underline">
            Open full flow →
          </Link>
        </div>
        <div className="divide-y divide-cockpit-border p-2">
          {recent.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-fg-muted">No transactions yet</p>
              <Button className="mt-4" size="sm" onClick={() => setAddOpen(true)}>
                Log first transaction
              </Button>
            </div>
          ) : (
            recent.map((e) => {
              const cat = categories.find((c) => c.id === e.categoryId);
              const income = isIncome(e);
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-4 rounded-xl px-3 py-3 transition hover-surface"
                >
                  <MerchantAvatar category={cat} description={e.description} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.description || 'Transaction'}</p>
                    <p className="text-xs text-fg-muted">
                      {income ? 'Income' : 'Expense'} · {cat?.name} · {formatDisplayDate(e.date)}
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
