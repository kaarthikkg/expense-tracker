import { create } from 'zustand';
import { db } from '@/db';
import type { RecurringExpense } from '@/types';
import { createId } from '@/utils/id';

interface RecurringState {
  items: RecurringExpense[];
  loading: boolean;
  load: () => Promise<void>;
  add: (data: Omit<RecurringExpense, 'id' | 'lastGeneratedDate'>) => Promise<void>;
  update: (id: string, data: Partial<Omit<RecurringExpense, 'id'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkSet: (items: RecurringExpense[]) => Promise<void>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  items: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const items = await db.recurringExpenses.toArray();
    set({ items, loading: false });
  },

  add: async (data) => {
    const item: RecurringExpense = {
      ...data,
      id: createId(),
      lastGeneratedDate: null,
    };
    await db.recurringExpenses.put(item);
    await get().load();
  },

  update: async (id, data) => {
    const existing = await db.recurringExpenses.get(id);
    if (!existing) return;
    await db.recurringExpenses.put({ ...existing, ...data });
    await get().load();
  },

  remove: async (id) => {
    await db.recurringExpenses.delete(id);
    await get().load();
  },

  bulkSet: async (items) => {
    await db.recurringExpenses.clear();
    await db.recurringExpenses.bulkPut(items);
    await get().load();
  },
}));
