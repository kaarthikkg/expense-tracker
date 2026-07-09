import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { PaymentSource, PaymentSourceKind } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { PageShell } from '@/components/layout/PageShell';
import {
  PAYMENT_SOURCE_KIND_META,
  PAYMENT_SOURCE_KIND_OPTIONS,
} from '@/db/paymentSources';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';

const COLOR_PRESETS = [
  '#3b82f6',
  '#5B8CFF',
  '#8b5cf6',
  '#06b6d4',
  '#22c55e',
  '#f97316',
  '#64748b',
  '#dc2626',
];

function kindLabel(kind: PaymentSourceKind): string {
  return PAYMENT_SOURCE_KIND_META[kind].label;
}

export function PaymentSourcesPage() {
  const paymentSources = usePaymentSourceStore((s) => s.paymentSources);
  const add = usePaymentSourceStore((s) => s.add);
  const update = usePaymentSourceStore((s) => s.update);
  const remove = usePaymentSourceStore((s) => s.remove);
  const getUsage = usePaymentSourceStore((s) => s.getUsage);

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentSource | null>(null);
  const [deleting, setDeleting] = useState<PaymentSource | null>(null);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [kind, setKind] = useState<PaymentSourceKind>('bank');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [reassignToId, setReassignToId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadUsage() {
      const entries = await Promise.all(
        paymentSources.map(async (p) => [p.id, await getUsage(p.id)] as const),
      );
      if (!cancelled) setUsageCounts(Object.fromEntries(entries));
    }
    void loadUsage();
    return () => {
      cancelled = true;
    };
  }, [paymentSources, getUsage]);

  const reassignOptions = useMemo(
    () =>
      paymentSources
        .filter((p) => p.id !== deleting?.id)
        .map((p) => ({ value: p.id, label: p.name })),
    [paymentSources, deleting],
  );

  const openCreate = () => {
    setEditing(null);
    setName('');
    setKind('bank');
    setColor(COLOR_PRESETS[0]);
    setError('');
    setOpen(true);
  };

  const openEdit = (source: PaymentSource) => {
    setEditing(source);
    setName(source.name);
    setKind(source.kind);
    setColor(source.color);
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      const payload = { name: name.trim(), kind, color };
      if (editing) await update(editing.id, payload);
      else await add(payload);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  };

  const startDelete = async (source: PaymentSource) => {
    const count = await getUsage(source.id);
    if (count === 0) {
      if (confirm(`Delete "${source.name}"?`)) {
        try {
          await remove(source.id);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not delete');
        }
      }
      return;
    }
    const others = paymentSources.filter((p) => p.id !== source.id);
    setDeleting(source);
    setReassignToId(others[0]?.id ?? '');
    setDeleteOpen(true);
  };

  const confirmDeleteWithReassign = async () => {
    if (!deleting || !reassignToId) {
      setError('Select an account to move transactions to');
      return;
    }
    setError('');
    try {
      await remove(deleting.id, reassignToId);
      setDeleteOpen(false);
      setDeleting(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete');
    }
  };

  return (
    <PageShell
      title="Cards & banks"
      subtitle="Accounts used for expenses and income"
      action={
        <Button size="sm" onClick={openCreate}>
          + Add account
        </Button>
      }
    >
      {error && !open && !deleteOpen && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {paymentSources.length === 0 ? (
        <Card>
          <p className="text-sm text-fg-secondary">
            Add bank accounts, cards, UPI, or cash to tag transactions.
          </p>
          <Button className="mt-4" size="sm" onClick={openCreate}>
            Add account
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paymentSources.map((source, i) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card noPadding>
                <div className="flex items-center gap-4 p-5">
                  <span
                    className="h-10 w-10 shrink-0 rounded-xl shadow-lg"
                    style={{
                      backgroundColor: source.color,
                      boxShadow: `0 4px 20px ${source.color}44`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{source.name}</p>
                    <p className="text-xs text-fg-muted">{kindLabel(source.kind)}</p>
                    {(usageCounts[source.id] ?? 0) > 0 && (
                      <p className="text-[11px] text-fg-secondary">
                        {usageCounts[source.id]} transaction
                        {usageCounts[source.id] === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(source)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void startDelete(source)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? 'Edit account' : 'New account'}
        onClose={() => setOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={error} />
          <Select
            label="Type"
            value={kind}
            onChange={(e) => setKind(e.target.value as PaymentSourceKind)}
            options={PAYMENT_SOURCE_KIND_OPTIONS}
          />
          <div>
            <span className="text-sm font-medium text-fg-secondary">Color</span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  className={`h-9 w-9 rounded-xl ring-2 ring-offset-2 ring-offset-cockpit-panel transition ${color === c ? 'ring-accent scale-110' : 'ring-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <label className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-cockpit-border px-2 text-xs text-fg-muted">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent"
                />
                Custom
              </label>
            </div>
          </div>
          <Button onClick={() => void handleSave()} fullWidth>
            Save
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        title={`Delete "${deleting?.name}"?`}
        onClose={() => {
          setDeleteOpen(false);
          setDeleting(null);
          setError('');
        }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-fg-secondary">
            Transactions use this account. Move them to another one before deleting.
          </p>
          {deleting && (
            <Select
              label="Move transactions to"
              value={reassignToId}
              onChange={(e) => setReassignToId(e.target.value)}
              options={reassignOptions}
            />
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => void confirmDeleteWithReassign()} fullWidth>
              Delete & move
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteOpen(false);
                setDeleting(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
