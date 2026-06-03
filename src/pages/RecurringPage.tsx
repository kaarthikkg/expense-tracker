import { useState } from 'react';
import type { RecurringFrequency } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PageShell } from '@/components/layout/PageShell';
import { useRecurringStore } from '@/store/recurringStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useCurrency } from '@/hooks/useCurrency';
import { toDateString } from '@/utils/dates';

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function RecurringPage() {
  const items = useRecurringStore((s) => s.items);
  const add = useRecurringStore((s) => s.add);
  const update = useRecurringStore((s) => s.update);
  const remove = useRecurringStore((s) => s.remove);
  const categories = useCategoryStore((s) => s.categories);
  const { format } = useCurrency();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(toDateString());

  const handleAdd = async () => {
    const num = parseFloat(amount);
    if (!num || !categoryId) return;
    await add({
      amount: num,
      categoryId,
      description,
      frequency,
      startDate,
      isActive: true,
    });
    setOpen(false);
    setAmount('');
    setDescription('');
  };

  return (
    <PageShell
      title="Recurring Flows"
      subtitle="Automated capital deployment"
      action={<Button size="sm" onClick={() => setOpen(true)}>+ Add recurring</Button>}
    >
      <p className="text-sm text-fg-muted -mt-2">
        Due items auto-post when the terminal initializes.
      </p>

      <div className="space-y-3">
        {items.map((item) => {
          const cat = categories.find((c) => c.id === item.categoryId);
          return (
            <Card key={item.id} noPadding>
              <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">{item.description || 'Recurring'}</p>
                  <p className="mt-1 text-sm text-fg-secondary">
                    {format(item.amount)} · {cat?.name} · {item.frequency}
                  </p>
                  <p className="mt-1 text-xs text-fg-muted">
                    {item.isActive ? (
                      <span className="text-success">● Active</span>
                    ) : (
                      <span>○ Paused</span>
                    )}
                    {item.lastGeneratedDate && ` · Last ${item.lastGeneratedDate}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => void update(item.id, { isActive: !item.isActive })}>
                    {item.isActive ? 'Pause' : 'Resume'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => confirm('Delete?') && void remove(item.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {items.length === 0 && (
        <p className="py-12 text-center text-sm text-fg-muted">
          No recurring flows configured.
        </p>
      )}

      <Modal open={open} title="Add recurring flow" onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-3">
          <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Select
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
            options={FREQUENCIES}
          />
          <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Button onClick={() => void handleAdd()} fullWidth>Save</Button>
        </div>
      </Modal>
    </PageShell>
  );
}
