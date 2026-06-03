import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Category } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageShell } from '@/components/layout/PageShell';
import { useCategoryStore } from '@/store/categoryStore';

const COLORS = ['#f97316', '#eab308', '#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#22c55e', '#5B8CFF'];

export function CategoriesPage() {
  const categories = useCategoryStore((s) => s.categories);
  const add = useCategoryStore((s) => s.add);
  const update = useCategoryStore((s) => s.update);
  const remove = useCategoryStore((s) => s.remove);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setColor(COLORS[0]);
    setError('');
    setOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setColor(cat.color);
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      if (editing) {
        await update(editing.id, { name: name.trim(), color });
      } else {
        await add({ name: name.trim(), color });
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save category');
    }
  };

  return (
    <PageShell
      title="Category Registry"
      subtitle="Classify capital flow"
      action={<Button size="sm" onClick={openCreate}>+ Add category</Button>}
    >
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
                  className="h-10 w-10 rounded-xl shadow-lg"
                  style={{ backgroundColor: cat.color, boxShadow: `0 4px 20px ${cat.color}44` }}
                />
                <div className="flex-1">
                  <p className="font-semibold">{cat.name}</p>
                  {cat.isDefault && (
                    <p className="text-[10px] uppercase tracking-wide text-fg-muted">
                      System default
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirm(`Delete "${cat.name}"?`) && void remove(cat.id)}
                  >
                    Del
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Modal open={open} title={editing ? 'Edit category' : 'New category'} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={error} />
          <label className="text-sm">
            <span className="font-medium text-fg-secondary">Color</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-9 w-9 rounded-xl ring-2 ring-offset-2 ring-offset-cockpit-panel transition ${color === c ? 'ring-accent scale-110' : 'ring-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </label>
          <Button onClick={() => void handleSave()} fullWidth>
            Save
          </Button>
        </div>
      </Modal>
    </PageShell>
  );
}
