import type { Category } from '@/types';
import { createId } from '@/utils/id';

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food', color: '#f97316', isDefault: true },
  { name: 'Fuel', color: '#eab308', isDefault: true },
  { name: 'Shopping', color: '#ec4899', isDefault: true },
  { name: 'Entertainment', color: '#8b5cf6', isDefault: true },
  { name: 'Bills', color: '#3b82f6', isDefault: true },
  { name: 'Travel', color: '#06b6d4', isDefault: true },
  { name: 'Health', color: '#22c55e', isDefault: true },
  { name: 'Others', color: '#64748b', isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Salary', color: '#22c55e', isDefault: true },
  { name: 'Freelance', color: '#5B8CFF', isDefault: true },
  { name: 'Business', color: '#06b6d4', isDefault: true },
  { name: 'Investments', color: '#8b5cf6', isDefault: true },
  { name: 'Gifts', color: '#ec4899', isDefault: true },
  { name: 'Other Income', color: '#64748b', isDefault: true },
];

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

  const defaultCat = group.find((c) => c.isDefault);
  if (defaultCat) return defaultCat;

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

/** Add default categories only when no category with that name exists. */
export async function ensureDefaultCategories(): Promise<void> {
  const db = await getDb();
  const existing = await db.categories.toArray();
  const names = new Set(existing.map((c) => normalizeCategoryName(c.name)));

  const toAdd = DEFAULT_CATEGORIES.filter(
    (c) => !names.has(normalizeCategoryName(c.name)),
  ).map((c) => ({
    ...c,
    id: createId(),
  }));

  if (toAdd.length > 0) {
    await db.categories.bulkAdd(toAdd);
  }
}

/** Default income categories (Salary, Freelance, etc.) */
export async function ensureDefaultIncomeCategories(): Promise<void> {
  const db = await getDb();
  const existing = await db.categories.toArray();
  const names = new Set(existing.map((c) => normalizeCategoryName(c.name)));

  const toAdd = DEFAULT_INCOME_CATEGORIES.filter(
    (c) => !names.has(normalizeCategoryName(c.name)),
  ).map((c) => ({
    ...c,
    id: createId(),
  }));

  if (toAdd.length > 0) {
    await db.categories.bulkAdd(toAdd);
  }
}
