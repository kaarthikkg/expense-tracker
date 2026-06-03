import * as XLSX from 'xlsx';
import { db } from '@/db';
import type { Category, CurrencyCode, Expense } from '@/types';
import {
  incomeByCategory,
  spendingByCategory,
  sumExpenses,
  sumIncome,
} from '@/services/analytics';
import { getMonthRange } from '@/utils/dates';
import { getTransactionType } from '@/utils/transaction';
import { onlyExpenses, onlyIncome } from '@/utils/transaction';

function filterByMonth(expenses: Expense[], monthKey: string): Expense[] {
  const { start, end } = getMonthRange(monthKey);
  return expenses
    .filter((e) => e.date >= start && e.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

function rowFromExpense(
  e: Expense,
  index: number,
  catMap: Map<string, string>,
  amountCol: string,
) {
  return {
    '#': index + 1,
    Date: e.date,
    Type: getTransactionType(e),
    Category: catMap.get(e.categoryId) ?? 'Unknown',
    Description: e.description,
    [amountCol]: e.amount,
    'Transaction ID': e.id,
    'Created at': e.createdAt,
  };
}

export async function downloadMonthlyExpensesExcel(
  monthKey: string,
  currency: CurrencyCode,
  expensesInput?: Expense[],
  categoriesInput?: Category[],
): Promise<void> {
  const [expenses, categories] = await Promise.all([
    expensesInput ? Promise.resolve(expensesInput) : db.expenses.toArray(),
    categoriesInput ? Promise.resolve(categoriesInput) : db.categories.toArray(),
  ]);

  const monthAll = filterByMonth(expenses, monthKey);
  const monthExpenseRows = onlyExpenses(monthAll);
  const monthIncomeRows = onlyIncome(monthAll);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const totalSpent = sumExpenses(monthExpenseRows);
  const totalEarned = sumIncome(monthIncomeRows);
  const amountCol = `Amount (${currency})`;

  const emptyExpenseRow = {
    '#': 0,
    Date: '—',
    Type: 'expense',
    Category: '—',
    Description: 'No expenses for this month',
    [amountCol]: 0,
    'Transaction ID': '—',
    'Created at': '—',
  };

  const allExpensesSheet =
    monthExpenseRows.length === 0
      ? [emptyExpenseRow]
      : monthExpenseRows.map((e, i) => rowFromExpense(e, i, catMap, amountCol));

  const allIncomeSheet =
    monthIncomeRows.length === 0
      ? [{ ...emptyExpenseRow, Type: 'income', Description: 'No income for this month' }]
      : monthIncomeRows.map((e, i) => rowFromExpense(e, i, catMap, amountCol));

  const allTransactionsSheet =
    monthAll.length === 0
      ? [{ ...emptyExpenseRow, Type: '—', Description: 'No transactions for this month' }]
      : monthAll.map((e, i) => rowFromExpense(e, i, catMap, amountCol));

  const expenseByCategory = spendingByCategory(monthExpenseRows, categories);
  const incomeByCat = incomeByCategory(monthIncomeRows, categories);
  const totalCol = `Total (${currency})`;

  const expenseCategorySummary = expenseByCategory.map((c) => ({
    Category: c.name,
    [totalCol]: c.total,
    '% of spend': totalSpent > 0 ? Math.round((c.total / totalSpent) * 1000) / 10 : 0,
  }));

  const incomeCategorySummary = incomeByCat.map((c) => ({
    Category: c.name,
    [totalCol]: c.total,
    '% of income': totalEarned > 0 ? Math.round((c.total / totalEarned) * 1000) / 10 : 0,
  }));

  const overview = [
    { Field: 'Month', Value: monthKey },
    { Field: 'Period', Value: `${getMonthRange(monthKey).start} to ${getMonthRange(monthKey).end}` },
    { Field: 'Currency', Value: currency },
    { Field: 'Expense count', Value: monthExpenseRows.length },
    { Field: 'Income count', Value: monthIncomeRows.length },
    { Field: 'Total transactions', Value: monthAll.length },
    { Field: 'Total expenses', Value: totalSpent },
    { Field: 'Total income', Value: totalEarned },
    { Field: 'Net cash flow', Value: totalEarned - totalSpent },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), 'Overview');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allExpensesSheet), 'All expenses');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      expenseCategorySummary.length > 0
        ? expenseCategorySummary
        : [{ Category: '—', [totalCol]: 0, '% of spend': 0 }],
    ),
    'Expenses by category',
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allIncomeSheet), 'All income');
  if (incomeCategorySummary.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(incomeCategorySummary),
      'Income by category',
    );
  }
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(allTransactionsSheet),
    'All transactions',
  );

  XLSX.writeFile(wb, `expenses-${monthKey}.xlsx`);
}
