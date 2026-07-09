import { useMemo, useState } from 'react';
import type { Expense } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExpenseTimeline } from '@/components/expenses/ExpenseTimeline';
import { PageShell } from '@/components/layout/PageShell';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import { filterByDateRange } from '@/services/analytics';
import { formatDisplayDate } from '@/utils/dates';
import { useCurrency } from '@/hooks/useCurrency';
import { getTransactionType, isExpense, isIncome } from '@/utils/transaction';
import type { TransactionType } from '@/types';

export function ExpensesPage() {
  const expenses = useExpenseStore((s) => s.expenses);
  const categories = useCategoryStore((s) => s.categories);
  const paymentSources = usePaymentSourceStore((s) => s.paymentSources);
  const add = useExpenseStore((s) => s.add);
  const update = useExpenseStore((s) => s.update);
  const remove = useExpenseStore((s) => s.remove);
  const { format } = useCurrency();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentSourceFilter, setPaymentSourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    let list = [...expenses];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.description.toLowerCase().includes(q));
    }
    if (typeFilter === 'expense') list = list.filter(isExpense);
    if (typeFilter === 'income') list = list.filter(isIncome);
    if (categoryFilter) list = list.filter((e) => e.categoryId === categoryFilter);
    if (paymentSourceFilter) {
      list = list.filter((e) => e.paymentSourceId === paymentSourceFilter);
    }
    list = filterByDateRange(list, dateFrom || undefined, dateTo || undefined);
    if (amountMin) list = list.filter((e) => e.amount >= parseFloat(amountMin));
    if (amountMax) list = list.filter((e) => e.amount <= parseFloat(amountMax));
    return list;
  }, [expenses, search, typeFilter, categoryFilter, paymentSourceFilter, dateFrom, dateTo, amountMin, amountMax]);

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const paymentSourceMap = useMemo(
    () => new Map(paymentSources.map((p) => [p.id, p])),
    [paymentSources],
  );

  return (
    <PageShell
      title="Transaction Flow"
      subtitle="Timeline view grouped by period"
      action={
        <Button onClick={() => { setSelected(null); setModal('add'); }} size="sm">
          + Log transaction
        </Button>
      }
    >
      <Card title="Filters" subtitle="Refine your capital flow">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | TransactionType)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'expense', label: 'Expenses' },
              { value: 'income', label: 'Income' },
            ]}
          />
          <Input
            label="Search"
            placeholder="Description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: '', label: 'All categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            label="Card / bank"
            value={paymentSourceFilter}
            onChange={(e) => setPaymentSourceFilter(e.target.value)}
            options={[
              { value: '', label: 'All accounts' },
              ...paymentSources.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <Input label="From date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input label="To date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Input label="Min amount" type="number" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} />
          <Input label="Max amount" type="number" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState message="No transactions match your filters." />
      ) : (
        <ExpenseTimeline
          expenses={filtered}
          categoryMap={catMap}
          paymentSourceMap={paymentSourceMap}
          onView={(e) => { setSelected(e); setModal('view'); }}
          onEdit={(e) => { setSelected(e); setModal('edit'); }}
          onDelete={(e) => {
            if (confirm('Delete this expense?')) void remove(e.id);
          }}
        />
      )}

      <Modal open={modal === 'add'} title="Log transaction" onClose={() => setModal(null)}>
        <ExpenseForm
          onCancel={() => setModal(null)}
          onSubmit={async (data) => {
            await add(data);
            setModal(null);
          }}
        />
      </Modal>

      <Modal open={modal === 'edit' && !!selected} title="Edit transaction" onClose={() => setModal(null)}>
        {selected && (
          <ExpenseForm
            initial={selected}
            onCancel={() => setModal(null)}
            onSubmit={async (data) => {
              await update(selected.id, data);
              setModal(null);
            }}
          />
        )}
      </Modal>

      <Modal open={modal === 'view' && !!selected} title="Transaction details" onClose={() => setModal(null)}>
        {selected && (
          <dl className="space-y-4 text-sm">
            {[
              ['Type', getTransactionType(selected) === 'income' ? 'Income' : 'Expense'],
              ['Amount', format(selected.amount)],
              ['Category', catMap.get(selected.categoryId)?.name],
              ['Card / bank', paymentSourceMap.get(selected.paymentSourceId ?? '')?.name ?? '—'],
              ['Description', selected.description || '—'],
              ['Date', formatDisplayDate(selected.date)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-cockpit-border pb-3">
                <dt className="text-fg-muted">{k}</dt>
                <dd className="font-mono font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </PageShell>
  );
}
