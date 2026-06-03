import { create } from 'zustand';
import { db } from '@/db';
import type { Budget } from '@/types';
import { createId } from '@/utils/id';

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  load: () => Promise<void>;
  upsert: (data: Omit<Budget, 'id'> & { id?: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkSet: (items: Budget[]) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const budgets = await db.budgets.toArray();
    set({ budgets, loading: false });
  },

  upsert: async (data) => {
    const id = data.id ?? createId();
    const budget: Budget = {
      id,
      categoryId: data.categoryId,
      amount: data.amount,
      month: data.month,
    };
    await db.budgets.put(budget);
    await get().load();
  },

  remove: async (id) => {
    await db.budgets.delete(id);
    await get().load();
  },

  bulkSet: async (items) => {
    await db.budgets.clear();
    await db.budgets.bulkPut(items);
    await get().load();
  },
}));
