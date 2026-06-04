import { create } from 'zustand';
import { db } from '@/db';
import type { Loan, LoanType } from '@/types';
import { createId } from '@/utils/id';

export type LoanInput = {
  name: string;
  loanType: LoanType;
  principalAmount: number;
  outstandingAmount: number;
  monthlyEmi?: number;
  interestRate?: number;
  startDate?: string;
  notes?: string;
};

interface LoanState {
  loans: Loan[];
  loading: boolean;
  load: () => Promise<void>;
  add: (data: LoanInput) => Promise<void>;
  update: (id: string, data: Partial<LoanInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkSet: (items: Loan[]) => Promise<void>;
}

export const useLoanStore = create<LoanState>((set, get) => ({
  loans: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const loans = await db.loans.orderBy('updatedAt').reverse().toArray();
    set({ loans, loading: false });
  },

  add: async (data) => {
    const now = new Date().toISOString();
    const loan: Loan = {
      id: createId(),
      name: data.name.trim(),
      loanType: data.loanType,
      principalAmount: data.principalAmount,
      outstandingAmount: data.outstandingAmount,
      monthlyEmi: data.monthlyEmi && data.monthlyEmi > 0 ? data.monthlyEmi : undefined,
      interestRate: data.interestRate,
      startDate: data.startDate || undefined,
      notes: data.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    await db.loans.put(loan);
    await get().load();
  },

  update: async (id, data) => {
    const existing = await db.loans.get(id);
    if (!existing) return;
    const monthlyEmi =
      data.monthlyEmi !== undefined
        ? data.monthlyEmi > 0
          ? data.monthlyEmi
          : undefined
        : existing.monthlyEmi;

    await db.loans.put({
      ...existing,
      ...data,
      name: data.name?.trim() ?? existing.name,
      monthlyEmi,
      notes: data.notes !== undefined ? data.notes.trim() || undefined : existing.notes,
      updatedAt: new Date().toISOString(),
    });
    await get().load();
  },

  remove: async (id) => {
    await db.loans.delete(id);
    await get().load();
  },

  bulkSet: async (items) => {
    await db.loans.clear();
    await db.loans.bulkPut(items);
    await get().load();
  },
}));
