import type { Expense } from '@/types';
import { toDateString } from '@/utils/dates';

export type ExpenseGroupKey = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'older';

export const GROUP_LABELS: Record<ExpenseGroupKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  older: 'Earlier',
};

export interface ExpenseGroup {
  key: ExpenseGroupKey;
  label: string;
  items: Expense[];
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getExpenseGroupKey(dateStr: string, now = new Date()): ExpenseGroupKey {
  const today = toDateString(now);
  const yesterday = toDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const weekStart = toDateString(startOfWeek(now));
  const monthStart = toDateString(startOfMonth(now));

  if (dateStr === today) return 'today';
  if (dateStr === yesterday) return 'yesterday';
  if (dateStr >= weekStart && dateStr < today) return 'thisWeek';
  if (dateStr >= monthStart && dateStr < weekStart) return 'thisMonth';
  return 'older';
}

const GROUP_ORDER: ExpenseGroupKey[] = [
  'today',
  'yesterday',
  'thisWeek',
  'thisMonth',
  'older',
];

export function groupExpensesByPeriod(expenses: Expense[]): ExpenseGroup[] {
  const buckets = new Map<ExpenseGroupKey, Expense[]>();
  for (const key of GROUP_ORDER) buckets.set(key, []);

  const sorted = [...expenses].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  for (const expense of sorted) {
    const key = getExpenseGroupKey(expense.date);
    buckets.get(key)!.push(expense);
  }

  return GROUP_ORDER.filter((key) => (buckets.get(key)?.length ?? 0) > 0).map((key) => ({
    key,
    label: GROUP_LABELS[key],
    items: buckets.get(key)!,
  }));
}
