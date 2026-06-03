import Dexie, { type Table } from 'dexie';
import { deduplicateCategories, seedInitialCategoriesIfEmpty } from '@/db/categories';
import type {
  AppSettings,
  Budget,
  Category,
  Expense,
  RecurringExpense,
  SavingsGoal,
} from '@/types';

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
    await deduplicateCategories();
    await seedInitialCategoriesIfEmpty();

    const settings = await db.settings.get('app');
    if (!settings) {
      await db.settings.put(DEFAULT_SETTINGS);
    }
  })().finally(() => {
    seedPromise = null;
  });

  return seedPromise;
}
