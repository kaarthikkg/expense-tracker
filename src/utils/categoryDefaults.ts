import type { Category, TransactionType } from '@/types';

export function findCategoryByName(
  categories: Category[],
  name: string,
): Category | undefined {
  const key = name.trim().toLowerCase();
  return categories.find((c) => c.name.trim().toLowerCase() === key);
}

/** Categories available when logging a transaction of the given type */
export function categoriesForTransactionType(
  categories: Category[],
  type: TransactionType,
): Category[] {
  return categories.filter((c) => !c.kind || c.kind === type);
}

/** First matching category for new transactions (no hardcoded names) */
export function getDefaultCategoryId(
  categories: Category[],
  type: TransactionType,
): string {
  const pool = categoriesForTransactionType(categories, type);
  const sorted = [...pool].sort((a, b) => a.name.localeCompare(b.name));
  return sorted[0]?.id ?? categories[0]?.id ?? '';
}
