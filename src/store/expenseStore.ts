import { create } from 'zustand';
import { db } from '@/db';
import type { Expense } from '@/types';
import { createId } from '@/utils/id';

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  load: () => Promise<void>;
  add: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkAdd: (items: Expense[]) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const expenses = await db.expenses.orderBy('date').reverse().toArray();
    set({ expenses, loading: false });
  },

  add: async (data) => {
    const expense: Expense = {
      ...data,
      type: data.type ?? 'expense',
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    await db.expenses.put(expense);
    await get().load();
  },

  update: async (id, data) => {
    const existing = await db.expenses.get(id);
    if (!existing) return;
    await db.expenses.put({ ...existing, ...data });
    await get().load();
  },

  remove: async (id) => {
    await db.expenses.delete(id);
    await get().load();
  },

  bulkAdd: async (items) => {
    await db.expenses.bulkPut(items);
    await get().load();
  },

  clearAll: async () => {
    await db.expenses.clear();
    await get().load();
  },
}));
