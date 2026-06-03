import type { Category, TransactionType } from '@/types';

export function findCategoryByName(
  categories: Category[],
  name: string,
): Category | undefined {
  const key = name.trim().toLowerCase();
  return categories.find((c) => c.name.trim().toLowerCase() === key);
}

/** Default category when logging a new transaction */
export function getDefaultCategoryId(
  categories: Category[],
  type: TransactionType,
): string {
  if (type === 'income') {
    const salary = findCategoryByName(categories, 'Salary');
    if (salary) return salary.id;
  }

  const food = findCategoryByName(categories, 'Food');
  return food?.id ?? categories[0]?.id ?? '';
}
