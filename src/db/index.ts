import Dexie, { type Table } from 'dexie';
import { deduplicateCategories, seedInitialCategoriesIfEmpty } from '@/db/categories';
import { seedInitialPaymentSourcesIfEmpty } from '@/db/paymentSources';
import type {
  AppSettings,
  Budget,
  Category,
  EvConfig,
  EvOdometerReading,
  Expense,
  Holding,
  Loan,
  PaymentSource,
  RecurringExpense,
  SavingsGoal,
} from '@/types';
import { DEFAULT_EV_CONFIG } from '@/utils/ev';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  theme: 'system',
  currency: 'INR',
};

export class ExpenseDatabase extends Dexie {
  expenses!: Table<Expense, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;
  goals!: Table<SavingsGoal, string>;
  settings!: Table<AppSettings, string>;
  recurringExpenses!: Table<RecurringExpense, string>;
  holdings!: Table<Holding, string>;
  loans!: Table<Loan, string>;
  paymentSources!: Table<PaymentSource, string>;
  evReadings!: Table<EvOdometerReading, string>;
  evConfig!: Table<EvConfig, string>;

  constructor() {
    super('ExpenseTrackerDB');
    this.version(1).stores({
      expenses: 'id, date, categoryId, createdAt',
      categories: 'id, name',
      budgets: 'id, month, categoryId',
      goals: 'id',
      settings: 'id',
      recurringExpenses: 'id, isActive',
    });
    this.version(2).stores({
      expenses: 'id, date, categoryId, createdAt',
      categories: 'id, name',
      budgets: 'id, month, categoryId',
      goals: 'id',
      settings: 'id',
      recurringExpenses: 'id, isActive, categoryId',
    });
    this.version(3).stores({
      expenses: 'id, date, categoryId, createdAt, type',
      categories: 'id, name',
      budgets: 'id, month, categoryId',
      goals: 'id',
      settings: 'id',
      recurringExpenses: 'id, isActive, categoryId',
    });
    this.version(4).stores({
      expenses: 'id, date, categoryId, createdAt, type',
      categories: 'id, name',
      budgets: 'id, month, categoryId',
      goals: 'id',
      settings: 'id',
      recurringExpenses: 'id, isActive, categoryId',
      holdings: 'id, assetType, symbol, name, updatedAt',
    });
    this.version(5).stores({
      expenses: 'id, date, categoryId, createdAt, type',
      categories: 'id, name',
      budgets: 'id, month, categoryId',
      goals: 'id',
      settings: 'id',
      recurringExpenses: 'id, isActive, categoryId',
      holdings: 'id, assetType, name, updatedAt',
      loans: 'id, loanType, name, updatedAt',
    });
    this.version(6).stores({
      expenses: 'id, date, categoryId, createdAt, type, paymentSourceId',
      categories: 'id, name',
      budgets: 'id, month, categoryId',
      goals: 'id',
      settings: 'id',
      recurringExpenses: 'id, isActive, categoryId',
      holdings: 'id, assetType, name, updatedAt',
      loans: 'id, loanType, name, updatedAt',
      paymentSources: 'id, name, kind',
    });
    this.version(7).stores({
      expenses: 'id, date, categoryId, createdAt, type, paymentSourceId',
      categories: 'id, name',
      budgets: 'id, month, categoryId',
      goals: 'id',
      settings: 'id',
      recurringExpenses: 'id, isActive, categoryId',
      holdings: 'id, assetType, name, updatedAt',
      loans: 'id, loanType, name, updatedAt',
      paymentSources: 'id, name, kind',
      evReadings: 'id, monthKey',
      evConfig: 'id',
    });
  }
}

type LegacyHoldingRow = Holding & {
  quantity?: number;
  avgBuyPrice?: number;
  currentPrice?: number;
  symbol?: string;
};

/** Convert per-unit holdings to total invested / current value. */
async function migrateHoldingsToTotals(): Promise<void> {
  const all = (await db.holdings.toArray()) as LegacyHoldingRow[];
  for (const h of all) {
    if (typeof h.investedAmount === 'number' && typeof h.currentValue === 'number') {
      continue;
    }
    const qty = h.quantity ?? 1;
    const avg = h.avgBuyPrice ?? 0;
    const price = h.currentPrice ?? avg;
    await db.holdings.put({
      id: h.id,
      name: h.name,
      assetType: h.assetType ?? 'other',
      investedAmount: qty * avg,
      currentValue: qty * price,
      notes: h.notes,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    });
  }
}

async function migrateTransactionTypes(): Promise<void> {
  const all = await db.expenses.toArray();
  const legacy = all.filter((e) => e.type === undefined);
  if (legacy.length === 0) return;
  await db.expenses.bulkPut(legacy.map((e) => ({ ...e, type: 'expense' as const })));
}

export const db = new ExpenseDatabase();

let seedPromise: Promise<void> | null = null;

export async function seedDatabase(): Promise<void> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    await migrateTransactionTypes();
    await migrateHoldingsToTotals();
    await deduplicateCategories();
    await seedInitialCategoriesIfEmpty();
    await seedInitialPaymentSourcesIfEmpty();

    const settings = await db.settings.get('app');
    if (!settings) {
      await db.settings.put(DEFAULT_SETTINGS);
    }

    const evConfig = await db.evConfig.get('app');
    if (!evConfig) {
      await db.evConfig.put(DEFAULT_EV_CONFIG);
    }
  })().finally(() => {
    seedPromise = null;
  });

  return seedPromise;
}
