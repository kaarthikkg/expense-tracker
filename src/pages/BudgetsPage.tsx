import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageShell } from '@/components/layout/PageShell';
import { AnimatedMetric } from '@/components/ui/AnimatedMetric';
import { useBudgetStore } from '@/store/budgetStore';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { getMonthExpenses, sumExpenses } from '@/services/analytics';
import { getMonthKey } from '@/utils/dates';
import { useCurrency } from '@/hooks/useCurrency';

export function BudgetsPage() {
  const budgets = useBudgetStore((s) => s.budgets);
  const upsert = useBudgetStore((s) => s.upsert);
  const expenses = useExpenseStore((s) => s.expenses);
  const categories = useCategoryStore((s) => s.categories);
  const { format } = useCurrency();

  const monthKey = getMonthKey();
  const monthExpenses = getMonthExpenses(expenses, monthKey);

  const [totalAmount, setTotalAmount] = useState('');
  const [catId, setCatId] = useState('');
  const [catAmount, setCatAmount] = useState('');

  const monthlyBudget = budgets.find((b) => b.month === monthKey && b.categoryId === null);
  const monthTotal = sumExpenses(monthExpenses);

  const saveMonthly = async () => {
    const amount = parseFloat(totalAmount);
    if (!amount) return;
    await upsert({
      id: monthlyBudget?.id,
      month: monthKey,
      categoryId: null,
      amount,
    });
    setTotalAmount('');
  };

  const saveCategory = async () => {
    const amount = parseFloat(catAmount);
    if (!amount || !catId) return;
    const existing = budgets.find(
      (b) => b.month === monthKey && b.categoryId === catId,
    );
    await upsert({
      id: existing?.id,
      month: monthKey,
      categoryId: catId,
      amount,
    });
    setCatAmount('');
  };

  const categoryBudgets = budgets.filter(
    (b) => b.month === monthKey && b.categoryId !== null,
  );

  return (
    <PageShell title="Burn Control" subtitle={`Allocation matrix · ${monthKey}`}>
      <Card title="Monthly envelope" subtitle="Total capital allocation">
        <div className="space-y-4">
          {monthlyBudget && (
            <>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-fg-muted">Deployed</span>
                <span><AnimatedMetric value={monthTotal} /></span>
              </div>
              <ProgressBar value={monthTotal} max={monthlyBudget.amount} />
              <p className="text-sm text-success">
                Reserve: {format(Math.max(0, monthlyBudget.amount - monthTotal))}
              </p>
            </>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Set monthly budget"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder={monthlyBudget ? String(monthlyBudget.amount) : '10000'}
            />
            <Button onClick={() => void saveMonthly()}>Commit</Button>
          </div>
        </div>
      </Card>

      <Card title="Category envelopes" subtitle="Per-sector burn limits">
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <Select
            label="Category"
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            options={[
              { value: '', label: 'Select...' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Input label="Amount" type="number" value={catAmount} onChange={(e) => setCatAmount(e.target.value)} />
          <Button onClick={() => void saveCategory()}>Add / update</Button>
        </div>

        <div className="space-y-5">
          {categoryBudgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const spent = sumExpenses(
              monthExpenses.filter((e) => e.categoryId === b.categoryId),
            );
            return (
              <div key={b.id} className="rounded-xl border border-cockpit-border p-4">
                <div className="mb-2 flex justify-between text-sm font-medium">
                  <span>{cat?.name}</span>
                  <span className="font-mono text-accent">{format(b.amount)}</span>
                </div>
                <p className="mb-2 text-xs text-fg-muted">
                  Spent {format(spent)} · {format(Math.max(0, b.amount - spent))} left
                </p>
                <ProgressBar value={spent} max={b.amount} color={cat?.color} />
              </div>
            );
          })}
          {categoryBudgets.length === 0 && (
            <p className="text-sm text-fg-muted">No category envelopes this month.</p>
          )}
        </div>
      </Card>
    </PageShell>
  );
}
