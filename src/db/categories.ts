import type { Category } from '@/types';
import { createId } from '@/utils/id';

/** Used only when the database has zero categories (first launch). */
const INITIAL_CATEGORIES: Array<Omit<Category, 'id'>> = [
  { name: 'Food', color: '#f97316', kind: 'expense' },
  { name: 'Fuel', color: '#eab308', kind: 'expense' },
  { name: 'Shopping', color: '#ec4899', kind: 'expense' },
  { name: 'Entertainment', color: '#8b5cf6', kind: 'expense' },
  { name: 'Bills', color: '#3b82f6', kind: 'expense' },
  { name: 'Travel', color: '#06b6d4', kind: 'expense' },
  { name: 'Health', color: '#22c55e', kind: 'expense' },
  { name: 'Others', color: '#64748b', kind: 'expense' },
  { name: 'Salary', color: '#22c55e', kind: 'income' },
  { name: 'Freelance', color: '#5B8CFF', kind: 'income' },
  { name: 'Business', color: '#06b6d4', kind: 'income' },
  { name: 'Investment income', color: '#8b5cf6', kind: 'income' },
  { name: 'Gifts', color: '#ec4899', kind: 'income' },
  { name: 'Other income', color: '#64748b', kind: 'income' },
];

export interface CategoryUsage {
  expenses: number;
  budgets: number;
  recurring: number;
}

// Lazy import avoids circular dependency with db/index.ts
async function getDb() {
  const { db } = await import('@/db/index');
  return db;
}

export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

export async function findCategoryByName(
  name: string,
  excludeId?: string,
): Promise<Category | undefined> {
  const db = await getDb();
  const key = normalizeCategoryName(name);
  const all = await db.categories.toArray();
  return all.find(
    (c) => c.id !== excludeId && normalizeCategoryName(c.name) === key,
  );
}

export async function getCategoryUsage(categoryId: string): Promise<CategoryUsage> {
  const db = await getDb();
  const [expenses, budgets, recurring] = await Promise.all([
    db.expenses.where('categoryId').equals(categoryId).count(),
    db.budgets.where('categoryId').equals(categoryId).count(),
    db.recurringExpenses.where('categoryId').equals(categoryId).count(),
  ]);
  return { expenses, budgets, recurring };
}

async function pickKeeperCategory(group: Category[]): Promise<Category> {
  const db = await getDb();
  const withUsage = await Promise.all(
    group.map(async (cat) => ({
      cat,
      count: await db.expenses.where('categoryId').equals(cat.id).count(),
    })),
  );
  withUsage.sort((a, b) => b.count - a.count);
  if (withUsage[0].count > 0) return withUsage[0].cat;
  return [...group].sort((a, b) => a.id.localeCompare(b.id))[0];
}

/** Merge categories that share the same name (case-insensitive). */
export async function deduplicateCategories(): Promise<number> {
  const db = await getDb();
  const categories = await db.categories.toArray();
  const byName = new Map<string, Category[]>();

  for (const cat of categories) {
    const key = normalizeCategoryName(cat.name);
    const list = byName.get(key) ?? [];
    list.push(cat);
    byName.set(key, list);
  }

  let removed = 0;

  for (const group of byName.values()) {
    if (group.length <= 1) continue;

    const keeper = await pickKeeperCategory(group);
    const duplicates = group.filter((c) => c.id !== keeper.id);

    for (const dup of duplicates) {
      await db.expenses.where('categoryId').equals(dup.id).modify({
        categoryId: keeper.id,
      });
      await db.budgets.where('categoryId').equals(dup.id).modify({
        categoryId: keeper.id,
      });
      await db.recurringExpenses.where('categoryId').equals(dup.id).modify({
        categoryId: keeper.id,
      });
      await db.categories.delete(dup.id);
      removed++;
    }
  }

  return removed;
}

/** Starter categories — only when the user has none (never re-add deleted names). */
export async function seedInitialCategoriesIfEmpty(): Promise<void> {
  const db = await getDb();
  if ((await db.categories.count()) > 0) return;

  await db.categories.bulkAdd(
    INITIAL_CATEGORIES.map((c) => ({
      ...c,
      id: createId(),
    })),
  );
}

export async function reassignCategoryReferences(
  fromId: string,
  toId: string,
): Promise<void> {
  const db = await getDb();
  await db.expenses.where('categoryId').equals(fromId).modify({ categoryId: toId });
  await db.budgets.where('categoryId').equals(fromId).modify({ categoryId: toId });
  await db.recurringExpenses.where('categoryId').equals(fromId).modify({ categoryId: toId });
}
