import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SavingsGoal } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageShell } from '@/components/layout/PageShell';
import { useGoalStore } from '@/store/goalStore';
import { useCurrency } from '@/hooks/useCurrency';

export function GoalsPage() {
  const goals = useGoalStore((s) => s.goals);
  const add = useGoalStore((s) => s.add);
  const update = useGoalStore((s) => s.update);
  const remove = useGoalStore((s) => s.remove);
  const { format } = useCurrency();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setTarget('');
    setCurrent('0');
    setOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditing(g);
    setName(g.name);
    setTarget(String(g.targetAmount));
    setCurrent(String(g.currentAmount));
    setOpen(true);
  };

  const save = async () => {
    const targetAmount = parseFloat(target);
    const currentAmount = parseFloat(current) || 0;
    if (!name.trim() || !targetAmount) return;
    if (editing) {
      await update(editing.id, { name, targetAmount, currentAmount });
    } else {
      await add({ name, targetAmount, currentAmount });
    }
    setOpen(false);
  };

  return (
    <PageShell
      title="Savings Momentum"
      subtitle="Capital accumulation targets"
      action={<Button size="sm" onClick={openCreate}>+ New target</Button>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map((g, i) => {
          const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <div className="flex justify-between">
                  <h3 className="font-semibold">{g.name}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>Edit</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirm('Delete goal?') && void remove(g.id)}
                    >
                      Del
                    </Button>
                  </div>
                </div>
                <p className="mt-3 font-mono text-sm text-fg-secondary">
                  {format(g.currentAmount)} / {format(g.targetAmount)}
                </p>
                <ProgressBar value={g.currentAmount} max={g.targetAmount} color="#22C55E" />
                <p className="mt-2 font-mono text-lg font-bold text-success">{Math.round(pct)}%</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <p className="text-center text-sm text-fg-muted py-12">
          Define a savings target to track momentum.
        </p>
      )}

      <Modal open={open} title={editing ? 'Edit target' : 'New target'} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-3">
          <Input label="Goal name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Target amount" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
          <Input label="Current saved" type="number" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <Button onClick={() => void save()} fullWidth>Save</Button>
        </div>
      </Modal>
    </PageShell>
  );
}
