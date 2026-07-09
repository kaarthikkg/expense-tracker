import { create } from 'zustand';
import { db } from '@/db';
import {
  findPaymentSourceByName,
  getPaymentSourceUsage,
  reassignPaymentSourceReferences,
} from '@/db/paymentSources';
import type { PaymentSource, PaymentSourceKind } from '@/types';
import { createId } from '@/utils/id';

export type PaymentSourceInput = {
  name: string;
  kind: PaymentSourceKind;
  color: string;
};

interface PaymentSourceState {
  paymentSources: PaymentSource[];
  loading: boolean;
  load: () => Promise<void>;
  add: (data: PaymentSourceInput) => Promise<void>;
  update: (id: string, data: Partial<PaymentSourceInput>) => Promise<void>;
  remove: (id: string, reassignToId?: string) => Promise<void>;
  getUsage: (id: string) => Promise<number>;
  bulkSet: (items: PaymentSource[]) => Promise<void>;
}

export class PaymentSourceInUseError extends Error {
  count: number;

  constructor(count: number) {
    super(
      `Used in ${count} transaction${count === 1 ? '' : 's'}. Choose another account to move them to.`,
    );
    this.name = 'PaymentSourceInUseError';
    this.count = count;
  }
}

export const usePaymentSourceStore = create<PaymentSourceState>((set, get) => ({
  paymentSources: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const paymentSources = await db.paymentSources.orderBy('name').toArray();
    set({ paymentSources, loading: false });
  },

  add: async (data) => {
    const duplicate = await findPaymentSourceByName(data.name);
    if (duplicate) {
      throw new Error(`An account named "${data.name}" already exists`);
    }
    await db.paymentSources.put({
      id: createId(),
      name: data.name.trim(),
      kind: data.kind,
      color: data.color,
    });
    await get().load();
  },

  update: async (id, data) => {
    const existing = await db.paymentSources.get(id);
    if (!existing) return;
    if (data.name) {
      const duplicate = await findPaymentSourceByName(data.name, id);
      if (duplicate) {
        throw new Error(`An account named "${data.name}" already exists`);
      }
    }
    await db.paymentSources.put({
      ...existing,
      ...data,
      name: data.name?.trim() ?? existing.name,
    });
    await get().load();
  },

  getUsage: async (id) => getPaymentSourceUsage(id),

  remove: async (id, reassignToId) => {
    const count = await getPaymentSourceUsage(id);
    if (count > 0) {
      if (!reassignToId) {
        throw new PaymentSourceInUseError(count);
      }
      if (reassignToId === id) {
        throw new Error('Choose a different account');
      }
      const target = await db.paymentSources.get(reassignToId);
      if (!target) throw new Error('Target account not found');
      await reassignPaymentSourceReferences(id, reassignToId);
    }
    await db.paymentSources.delete(id);
    await get().load();
  },

  bulkSet: async (items) => {
    await db.paymentSources.clear();
    await db.paymentSources.bulkPut(items);
    await get().load();
  },
}));
