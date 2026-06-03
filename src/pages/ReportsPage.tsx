import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { CategoryBarsChart } from '@/components/charts/CategoryBarsChart';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { InsightFeed } from '@/components/dashboard/InsightFeed';
import { PageShell } from '@/components/layout/PageShell';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useBudgetStore } from '@/store/budgetStore';
import {
  dailyTrendForMonth,
  filterByDateRange,
  generateInsights,
  getMonthExpenses,
  highestSpendingDay,
  spendingByCategory,
  sumExpenses,
  topCategory,
} from '@/services/analytics';
import { getMonthKey, getMonthRange, getYearRange, toDateString } from '@/utils/dates';
import { useCurrency } from '@/hooks/useCurrency';
import { useSettingsStore } from '@/store/settingsStore';
import { downloadMonthlyExpensesExcel } from '@/services/excelExport';

type ReportPeriod = 'daily' | 'monthly' | 'yearly';

export function ReportsPage() {
  const expenses = useExpenseStore((s) => s.expenses);
  const categories = useCategoryStore((s) => s.categories);
  const budgets = useBudgetStore((s) => s.budgets);
  const { format } = useCurrency();
  const currency = useSettingsStore((s) => s.settings?.currency ?? 'INR');

  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const today = toDateString();
  const monthKey = getMonthKey();
  const year = new Date().getFullYear();

  const filteredExpenses = useMemo(() => {
    if (period === 'daily') {
      return expenses.filter((e) => e.date === today);
    }
    if (period === 'monthly') {
      const { start, end } = getMonthRange(monthKey);
      return filterByDateRange(expenses, start, end);
    }
    const { start, end } = getYearRange(year);
    return filterByDateRange(expenses, start, end);
  }, [expenses, period, today, monthKey, year]);

  const total = sumExpenses(filteredExpenses);
  const top = topCategory(filteredExpenses, categories);
  const highestDay = highestSpendingDay(filteredExpenses);
  const barData = spendingByCategory(filteredExpenses, categories);
  const trend =
    period === 'monthly'
      ? dailyTrendForMonth(expenses, monthKey)
      : period === 'yearly'
        ? []
        : [{ date: today, total }];

  const insights = generateInsights(expenses, categories);
  const monthlyBudget = budgets.find((b) => b.month === monthKey && b.categoryId === null);
  const monthTotal = sumExpenses(getMonthExpenses(expenses, monthKey));
  const utilization = monthlyBudget ? (monthTotal / monthlyBudget.amount) * 100 : 0;

  return (
    <PageShell
      title="Analytics Terminal"
      subtitle="Deep capital intelligence"
      action={
        <div className="flex flex-wrap gap-2">
          {period === 'monthly' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                void downloadMonthlyExpensesExcel(monthKey, currency, expenses, categories)
              }
            >
              Export {monthKey}
            </Button>
          )}
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card noPadding>
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-widest text-fg-muted">
              Total ({period})
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-accent metric-glow">{format(total)}</p>
          </div>
        </Card>
        <Card noPadding>
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-widest text-fg-muted">Top sector</p>
            <p className="mt-2 text-lg font-semibold">{top?.name ?? '—'}</p>
          </div>
        </Card>
        <Card noPadding>
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-widest text-fg-muted">Peak day</p>
            <p className="mt-2 text-sm font-medium">
              {highestDay ? `${highestDay.date} · ${format(highestDay.total)}` : '—'}
            </p>
          </div>
        </Card>
      </div>

      {monthlyBudget && period === 'monthly' && (
        <Card title="Budget utilization">
          <p className="mb-3 text-sm text-fg-secondary">
            {format(monthTotal)} of {format(monthlyBudget.amount)} ({Math.round(utilization)}%)
          </p>
          <ProgressBar value={monthTotal} max={monthlyBudget.amount} />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Sector breakdown">
          <CategoryBarsChart data={barData} />
        </Card>
        {period !== 'yearly' && (
          <Card title="Flow trend">
            <TrendAreaChart data={trend} />
          </Card>
        )}
      </div>

      <Card title="Intelligence feed">
        <InsightFeed insights={insights} />
      </Card>
    </PageShell>
  );
}
