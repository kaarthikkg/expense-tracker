import { useState } from 'react';
import type { Expense, TransactionType } from '@/types';
import { useCategoryStore } from '@/store/categoryStore';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toDateString } from '@/utils/dates';
import {
  categoriesForTransactionType,
  getDefaultCategoryId,
} from '@/utils/categoryDefaults';
import { getTransactionType } from '@/utils/transaction';

interface ExpenseFormProps {
  initial?: Expense;
  defaultType?: TransactionType;
  onSubmit: (data: {
    amount: number;
    categoryId: string;
    paymentSourceId?: string;
    description: string;
    date: string;
    type: TransactionType;
  }) => void | Promise<void>;
  onCancel: () => void;
}

export function ExpenseForm({
  initial,
  defaultType = 'expense',
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const categories = useCategoryStore((s) => s.categories);
  const paymentSources = usePaymentSourceStore((s) => s.paymentSources);
  const startType = initial ? getTransactionType(initial) : defaultType;

  const [type, setType] = useState<TransactionType>(startType);
  const [amount, setAmount] = useState(String(initial?.amount ?? ''));
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? getDefaultCategoryId(categories, startType),
  );
  const [paymentSourceId, setPaymentSourceId] = useState(initial?.paymentSourceId ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.date ?? toDateString());
  const [error, setError] = useState('');

  const categoryOptions = categoriesForTransactionType(categories, type);
  const paymentOptions = [
    { value: '', label: '— Not set —' },
    ...paymentSources.map((p) => ({ value: p.id, label: p.name })),
  ];

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    if (!initial) {
      const pool = categoriesForTransactionType(categories, next);
      const stillValid = pool.some((c) => c.id === categoryId);
      setCategoryId(
        stillValid ? categoryId : getDefaultCategoryId(categories, next),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!categoryId) {
      setError('Select a category');
      return;
    }
    setError('');
    await onSubmit({
      amount: num,
      categoryId,
      paymentSourceId: paymentSourceId || undefined,
      description,
      date,
      type,
    });
  };

  const isIncome = type === 'income';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex rounded-xl border border-cockpit-border-strong bg-cockpit-elevated p-1 dark:bg-cockpit-elevated/60">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
              type === t
                ? t === 'income'
                  ? 'bg-success/15 text-success shadow-sm ring-1 ring-success/20'
                  : 'surface-active text-fg shadow-sm ring-1 ring-cockpit-border-strong'
                : 'text-fg-muted hover:text-fg-secondary'
            }`}
          >
            {t === 'expense' ? 'Expense' : 'Income'}
          </button>
        ))}
      </div>

      <Input
        label={isIncome ? 'Income amount' : 'Expense amount'}
        type="number"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <Select
        label="Category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={
          categoryOptions.length > 0
            ? categoryOptions.map((c) => ({ value: c.id, label: c.name }))
            : [{ value: '', label: 'Add a category first' }]
        }
      />
      <Select
        label="Card / bank"
        value={paymentSourceId}
        onChange={(e) => setPaymentSourceId(e.target.value)}
        options={
          paymentSources.length > 0
            ? paymentOptions
            : [{ value: '', label: 'Add accounts under Cards & banks' }]
        }
      />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={isIncome ? 'Monthly salary, bonus…' : 'What was this for?'}
      />
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" fullWidth>
          {initial ? 'Update' : 'Log'} {isIncome ? 'income' : 'expense'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
