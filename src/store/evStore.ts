import { create } from 'zustand';
import { db } from '@/db';
import type { EvConfig, EvOdometerReading } from '@/types';
import { createId } from '@/utils/id';
import { DEFAULT_EV_CONFIG, normalizeEvConfig } from '@/utils/ev';

export type EvReadingInput = {
  monthKey: string;
  odometerKm: number;
  notes?: string;
};

interface EvState {
  readings: EvOdometerReading[];
  config: EvConfig;
  loading: boolean;
  load: () => Promise<void>;
  upsertReading: (data: EvReadingInput) => Promise<void>;
  updateReading: (id: string, data: Partial<EvReadingInput>) => Promise<void>;
  removeReading: (id: string) => Promise<void>;
  saveConfig: (data: Partial<Omit<EvConfig, 'id'>>) => Promise<void>;
  bulkSet: (readings: EvOdometerReading[], config?: EvConfig) => Promise<void>;
}

export const useEvStore = create<EvState>((set, get) => ({
  readings: [],
  config: DEFAULT_EV_CONFIG,
  loading: false,

  load: async () => {
    set({ loading: true });
    const [readings, configRow] = await Promise.all([
      db.evReadings.orderBy('monthKey').reverse().toArray(),
      db.evConfig.get('app'),
    ]);
    set({
      readings,
      config: normalizeEvConfig(configRow),
      loading: false,
    });
  },

  upsertReading: async (data) => {
    const existing = await db.evReadings.where('monthKey').equals(data.monthKey).first();
    const now = new Date().toISOString();
    if (existing) {
      await db.evReadings.put({
        ...existing,
        odometerKm: data.odometerKm,
        notes: data.notes?.trim() || undefined,
        updatedAt: now,
      });
    } else {
      const row: EvOdometerReading = {
        id: createId(),
        monthKey: data.monthKey,
        odometerKm: data.odometerKm,
        notes: data.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      await db.evReadings.put(row);
    }
    await get().load();
  },

  updateReading: async (id, data) => {
    const existing = await db.evReadings.get(id);
    if (!existing) return;
    const monthKey = data.monthKey ?? existing.monthKey;
    if (data.monthKey && data.monthKey !== existing.monthKey) {
      const clash = await db.evReadings.where('monthKey').equals(data.monthKey).first();
      if (clash && clash.id !== id) {
        throw new Error('A reading already exists for that month');
      }
    }
    await db.evReadings.put({
      ...existing,
      monthKey,
      odometerKm: data.odometerKm ?? existing.odometerKm,
      notes:
        data.notes !== undefined ? data.notes.trim() || undefined : existing.notes,
      updatedAt: new Date().toISOString(),
    });
    await get().load();
  },

  removeReading: async (id) => {
    await db.evReadings.delete(id);
    await get().load();
  },

  saveConfig: async (data) => {
    const next = normalizeEvConfig({ ...get().config, ...data });
    await db.evConfig.put(next);
    set({ config: next });
  },

  bulkSet: async (readings, config) => {
    await db.evReadings.clear();
    await db.evReadings.bulkPut(readings);
    if (config) {
      await db.evConfig.put(normalizeEvConfig(config));
    }
    await get().load();
  },
}));
