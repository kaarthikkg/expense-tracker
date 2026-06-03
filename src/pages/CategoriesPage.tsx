import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Category, CategoryKind } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { PageShell } from '@/components/layout/PageShell';
import { useCategoryStore } from '@/store/categoryStore';

const COLOR_PRESETS = [
  '#f97316',
  '#eab308',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#06b6d4',
  '#22c55e',
  '#5B8CFF',
  '#64748b',
  '#dc2626',
];

const KIND_OPTIONS: { value: CategoryKind | ''; label: string }[] = [
  { value: '', label: 'Expense & income' },
  { value: 'expense', label: 'Expenses only' },
  { value: 'income', label: 'Income only' },
];

function kindLabel(kind?: CategoryKind): string {
  if (kind === 'expense') return 'Expenses';
  if (kind === 'income') return 'Income';
  return 'Expense & income';
}

export function CategoriesPage() {
  const categories = useCategoryStore((s) => s.categories);
  const add = useCategoryStore((s) => s.add);
  const update = useCategoryStore((s) => s.update);
  const remove = useCategoryStore((s) => s.remove);
  const getUsage = useCategoryStore((s) => s.getUsage);

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [kind, setKind] = useState<CategoryKind | ''>('');
  const [reassignToId, setReassignToId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadUsage() {
      const entries = await Promise.all(
        categories.map(async (c) => {
          const u = await getUsage(c.id);
          return [c.id, u.expenses + u.budgets + u.recurring] as const;
        }),
      );
      if (!cancelled) {
        setUsageCounts(Object.fromEntries(entries));
      }
    }
    void loadUsage();
    return () => {
      cancelled = true;
    };
  }, [categories, getUsage]);

  const reassignOptions = useMemo(
    () =>
      categories
        .filter((c) => c.id !== deleting?.id)
        .map((c) => ({ value: c.id, label: c.name })),
    [categories, deleting],
  );

  const openCreate = () => {
    setEditing(null);
    setName('');
    setColor(COLOR_PRESETS[0]);
    setKind('');
    setError('');
    setOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setColor(cat.color);
    setKind(cat.kind ?? '');
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      const payload = {
        name: name.trim(),
        color,
        kind: kind || undefined,
      };
      if (editing) {
        await update(editing.id, payload);
      } else {
        await add(payload);
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save category');
    }
  };

  const startDelete = async (cat: Category) => {
    setError('');
    const u = await getUsage(cat.id);
    const total = u.expenses + u.budgets + u.recurring;
    if (total === 0) {
      if (confirm(`Delete "${cat.name}"?`)) {
        try {
          await remove(cat.id);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not delete');
        }
      }
      return;
    }
    const others = categories.filter((c) => c.id !== cat.id);
    setDeleting(cat);
    setReassignToId(others[0]?.id ?? '');
    setDeleteOpen(true);
  };

  const confirmDeleteWithReassign = async () => {
    if (!deleting || !reassignToId) {
      setError('Select a category to move existing data to');
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
      title="Categories"
      subtitle="Add, edit, or remove — nothing is locked"
      action={
        <Button size="sm" onClick={openCreate}>
          + Add category
        </Button>
      }
    >
      {error && !open && !deleteOpen && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {categories.length === 0 ? (
        <Card>
          <p className="text-sm text-fg-secondary">
            No categories yet. Add one to start logging transactions.
          </p>
          <Button className="mt-4" size="sm" onClick={openCreate}>
            Create category
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card noPadding>
                <div className="flex items-center gap-4 p-5">
                  <span
                    className="h-10 w-10 shrink-0 rounded-xl shadow-lg"
                    style={{
                      backgroundColor: cat.color,
                      boxShadow: `0 4px 20px ${cat.color}44`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{cat.name}</p>
                    <p className="text-xs text-fg-muted">{kindLabel(cat.kind)}</p>
                    {(usageCounts[cat.id] ?? 0) > 0 && (
                      <p className="text-[11px] text-fg-secondary">
                        {usageCounts[cat.id]} linked record
                        {usageCounts[cat.id] === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void startDelete(cat)}>
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
        title={editing ? 'Edit category' : 'New category'}
        onClose={() => setOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={error} />
          <Select
            label="Used for"
            value={kind}
            onChange={(e) => setKind(e.target.value as CategoryKind | '')}
            options={KIND_OPTIONS}
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
            This category is used in existing transactions, budgets, or recurring rules. Move
            them to another category, then delete.
          </p>
          {deleting && (
            <Select
              label="Move data to"
              value={reassignToId}
              onChange={(e) => setReassignToId(e.target.value)}
              options={reassignOptions}
            />
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => void confirmDeleteWithReassign()} fullWidth>
              Delete & move data
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
