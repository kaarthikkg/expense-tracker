import { db } from '@/db';
import type { RecurringExpense, RecurringFrequency } from '@/types';
import { addDays, addMonths, addYears, toDateString } from '@/utils/dates';
import { createId } from '@/utils/id';

function nextDate(date: string, frequency: RecurringFrequency): string {
  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addDays(date, 7);
    case 'monthly':
      return addMonths(date, 1);
    case 'yearly':
      return addYears(date, 1);
  }
}

function datesDue(
  item: RecurringExpense,
  until: string,
): string[] {
  const dates: string[] = [];
  let cursor = item.lastGeneratedDate
    ? nextDate(item.lastGeneratedDate, item.frequency)
    : item.startDate;

  while (cursor <= until) {
    if (cursor >= item.startDate) dates.push(cursor);
    cursor = nextDate(cursor, item.frequency);
    if (dates.length > 365) break;
  }
  return dates;
}

export async function processRecurringExpenses(): Promise<number> {
  const today = toDateString();
  const items = await db.recurringExpenses.filter((r) => r.isActive).toArray();
  let created = 0;

  for (const item of items) {
    const dueDates = datesDue(item, today);
    if (dueDates.length === 0) continue;

    let lastDate = item.lastGeneratedDate;
    for (const date of dueDates) {
      const exists = await db.expenses
        .filter(
          (e) =>
            e.date === date &&
            e.categoryId === item.categoryId &&
            e.description === item.description &&
            e.amount === item.amount,
        )
        .first();

      if (!exists) {
        await db.expenses.put({
          id: createId(),
          amount: item.amount,
          categoryId: item.categoryId,
          description: `[Recurring] ${item.description}`,
          date,
          type: 'expense',
          createdAt: new Date().toISOString(),
        });
        created++;
      }
      lastDate = date;
    }

    if (lastDate && lastDate !== item.lastGeneratedDate) {
      await db.recurringExpenses.update(item.id, { lastGeneratedDate: lastDate });
    }
  }

  return created;
}
