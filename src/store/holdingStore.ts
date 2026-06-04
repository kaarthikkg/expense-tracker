import { create } from 'zustand';
import { db } from '@/db';
import type { AssetType, Holding } from '@/types';
import { createId } from '@/utils/id';

export type HoldingInput = {
  name: string;
  assetType: AssetType;
  investedAmount: number;
  currentValue: number;
  notes?: string;
};

interface HoldingState {
  holdings: Holding[];
  loading: boolean;
  load: () => Promise<void>;
  add: (data: HoldingInput) => Promise<void>;
  update: (id: string, data: Partial<HoldingInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkSet: (items: Holding[]) => Promise<void>;
}

export const useHoldingStore = create<HoldingState>((set, get) => ({
  holdings: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const holdings = await db.holdings.orderBy('updatedAt').reverse().toArray();
    set({ holdings, loading: false });
  },

  add: async (data) => {
    const now = new Date().toISOString();
    const holding: Holding = {
      id: createId(),
      name: data.name.trim(),
      assetType: data.assetType,
      investedAmount: data.investedAmount,
      currentValue: data.currentValue,
      notes: data.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    await db.holdings.put(holding);
    await get().load();
  },

  update: async (id, data) => {
    const existing = await db.holdings.get(id);
    if (!existing) return;
    await db.holdings.put({
      ...existing,
      ...data,
      name: data.name?.trim() ?? existing.name,
      notes: data.notes !== undefined ? data.notes.trim() || undefined : existing.notes,
      updatedAt: new Date().toISOString(),
    });
    await get().load();
  },

  remove: async (id) => {
    await db.holdings.delete(id);
    await get().load();
  },

  bulkSet: async (items) => {
    await db.holdings.clear();
    await db.holdings.bulkPut(items);
    await get().load();
  },
}));
