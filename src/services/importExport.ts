import { db } from '@/db';
import type { ExportData } from '@/types';
import { getTransactionType } from '@/utils/transaction';

const EXPORT_VERSION = 1;

export async function buildExportData(): Promise<ExportData> {
  const [expenses, categories, budgets, goals, recurringExpenses, settings] =
    await Promise.all([
      db.expenses.toArray(),
      db.categories.toArray(),
      db.budgets.toArray(),
      db.goals.toArray(),
      db.recurringExpenses.toArray(),
      db.settings.get('app'),
    ]);

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    expenses,
    categories,
    budgets,
    goals,
    recurringExpenses,
    settings: settings ?? { id: 'app', theme: 'system', currency: 'INR' },
  };
}

export function downloadJson(data: ExportData, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function expensesToCsv(
  expenses: ExportData['expenses'],
  categories: ExportData['categories'],
): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const header = 'id,type,amount,category,description,date,createdAt';
  const rows = expenses.map((e) =>
    [
      e.id,
      getTransactionType(e),
      e.amount,
      catMap.get(e.categoryId) ?? e.categoryId,
      `"${e.description.replace(/"/g, '""')}"`,
      e.date,
      e.createdAt,
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(data: ExportData): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.expenses,
      db.categories,
      db.budgets,
      db.goals,
      db.recurringExpenses,
      db.settings,
    ],
    async () => {
      await db.expenses.clear();
      await db.categories.clear();
      await db.budgets.clear();
      await db.goals.clear();
      await db.recurringExpenses.clear();

      await db.expenses.bulkPut(data.expenses);
      await db.categories.bulkPut(data.categories);
      await db.budgets.bulkPut(data.budgets);
      await db.goals.bulkPut(data.goals);
      await db.recurringExpenses.bulkPut(data.recurringExpenses);
      await db.settings.put(data.settings);
    },
  );
}

export function parseImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as ExportData;
        if (!data.expenses || !data.categories) {
          reject(new Error('Invalid backup file'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Could not parse JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
