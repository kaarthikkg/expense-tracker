import { create } from 'zustand';
import { db } from '@/db';
import type { SavingsGoal } from '@/types';
import { createId } from '@/utils/id';

interface GoalState {
  goals: SavingsGoal[];
  loading: boolean;
  load: () => Promise<void>;
  add: (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount'> & { currentAmount?: number }) => Promise<void>;
  update: (id: string, data: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkSet: (items: SavingsGoal[]) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const goals = await db.goals.toArray();
    set({ goals, loading: false });
  },

  add: async (data) => {
    const goal: SavingsGoal = {
      id: createId(),
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount ?? 0,
      createdAt: new Date().toISOString(),
    };
    await db.goals.put(goal);
    await get().load();
  },

  update: async (id, data) => {
    const existing = await db.goals.get(id);
    if (!existing) return;
    await db.goals.put({ ...existing, ...data });
    await get().load();
  },

  remove: async (id) => {
    await db.goals.delete(id);
    await get().load();
  },

  bulkSet: async (items) => {
    await db.goals.clear();
    await db.goals.bulkPut(items);
    await get().load();
  },
}));
