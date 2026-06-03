import type { Category, Expense } from '@/types';
import { getMonthKey, isInMonth, isSameDay, toDateString } from '@/utils/dates';
import { onlyExpenses, onlyIncome } from '@/utils/transaction';

export interface CategorySpend {
  categoryId: string;
  name: string;
  color: string;
  total: number;
}

export interface DaySpend {
  date: string;
  total: number;
}

export function filterByDateRange(
  expenses: Expense[],
  start?: string,
  end?: string,
): Expense[] {
  return expenses.filter((e) => {
    if (start && e.date < start) return false;
    if (end && e.date > end) return false;
    return true;
  });
}

export function sumExpenses(expenses: Expense[]): number {
  return onlyExpenses(expenses).reduce((s, e) => s + e.amount, 0);
}

export function sumIncome(expenses: Expense[]): number {
  return onlyIncome(expenses).reduce((s, e) => s + e.amount, 0);
}

export function getTodayExpenses(expenses: Expense[]): Expense[] {
  const today = toDateString();
  return onlyExpenses(expenses).filter((e) => isSameDay(e.date, today));
}

export function getTodayIncome(expenses: Expense[]): Expense[] {
  const today = toDateString();
  return onlyIncome(expenses).filter((e) => isSameDay(e.date, today));
}

export function getMonthExpenses(expenses: Expense[], monthKey?: string): Expense[] {
  const key = monthKey ?? getMonthKey();
  return onlyExpenses(expenses).filter((e) => isInMonth(e.date, key));
}

export function getMonthIncome(expenses: Expense[], monthKey?: string): Expense[] {
  const key = monthKey ?? getMonthKey();
  return onlyIncome(expenses).filter((e) => isInMonth(e.date, key));
}

export function spendingByCategory(
  expenses: Expense[],
  categories: Category[],
): CategorySpend[] {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, number>();

  for (const e of onlyExpenses(expenses)) {
    const amount = Number(e.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + amount);
  }

  return Array.from(totals.entries())
    .map(([categoryId, total]) => {
      const cat = catMap.get(categoryId);
      return {
        categoryId,
        name: cat?.name ?? 'Uncategorized',
        color: cat?.color ?? '#64748b',
        total,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Expense totals by category for a single calendar month (expenses only). */
export function monthSpendingByCategory(
  expenses: Expense[],
  categories: Category[],
  monthKey?: string,
): CategorySpend[] {
  return spendingByCategory(getMonthExpenses(expenses, monthKey), categories);
}

export function incomeByCategory(
  expenses: Expense[],
  categories: Category[],
): CategorySpend[] {
  const map = new Map<string, number>();
  for (const e of onlyIncome(expenses)) {
    map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount);
  }
  return categories
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      color: c.color,
      total: map.get(c.id) ?? 0,
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function topCategory(
  expenses: Expense[],
  categories: Category[],
): CategorySpend | null {
  const list = spendingByCategory(expenses, categories);
  return list[0] ?? null;
}

export function dailyTrendForMonth(expenses: Expense[], monthKey: string): DaySpend[] {
  const monthExpenses = getMonthExpenses(expenses, monthKey);
  const map = new Map<string, number>();
  for (const e of monthExpenses) {
    map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
  }
  return Array.from(map.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function monthOverMonthChange(
  expenses: Expense[],
  categoryId: string,
): { percent: number; direction: 'up' | 'down' | 'same' } | null {
  const now = new Date();
  const thisMonth = getMonthKey(now);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = getMonthKey(prev);

  const thisTotal = sumExpenses(
    getMonthExpenses(expenses, thisMonth).filter((e) => e.categoryId === categoryId),
  );
  const lastTotal = sumExpenses(
    getMonthExpenses(expenses, lastMonth).filter((e) => e.categoryId === categoryId),
  );

  if (lastTotal === 0) return null;
  const percent = Math.round(((thisTotal - lastTotal) / lastTotal) * 100);
  if (percent === 0) return { percent: 0, direction: 'same' };
  return { percent: Math.abs(percent), direction: percent > 0 ? 'up' : 'down' };
}

export function highestSpendingDay(expenses: Expense[]): DaySpend | null {
  const map = new Map<string, number>();
  for (const e of onlyExpenses(expenses)) {
    map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
  }
  let best: DaySpend | null = null;
  for (const [date, total] of map) {
    if (!best || total > best.total) best = { date, total };
  }
  return best;
}

export function generateInsights(
  expenses: Expense[],
  categories: Category[],
): string[] {
  const insights: string[] = [];
  const monthKey = getMonthKey();
  const monthExpenses = getMonthExpenses(expenses, monthKey);
  const monthIncome = getMonthIncome(expenses, monthKey);
  const spent = sumExpenses(monthExpenses);
  const earned = sumIncome(monthIncome);

  if (earned > 0) {
    insights.push(`You logged ${earned.toLocaleString()} in income this month.`);
    if (spent > 0) {
      const net = earned - spent;
      insights.push(
        net >= 0
          ? `Net cash flow this month is positive (${net.toLocaleString()} surplus).`
          : `Net cash flow this month is negative (${Math.abs(net).toLocaleString()} deficit).`,
      );
    }
  }

  const top = topCategory(monthExpenses, categories);
  if (top) {
    insights.push(`Your top spending category this month is ${top.name}.`);
  }
  const highestDay = highestSpendingDay(monthExpenses);
  if (highestDay) {
    insights.push(
      `Your highest spending day this month was ${highestDay.date} (${highestDay.total}).`,
    );
  }
  for (const cat of categories) {
    const change = monthOverMonthChange(expenses, cat.id);
    if (change && change.direction !== 'same') {
      const word = change.direction === 'up' ? 'more' : 'less';
      insights.push(
        `You spent ${change.percent}% ${word} on ${cat.name.toLowerCase()} this month compared to last month.`,
      );
    }
  }
  return insights.slice(0, 6);
}
