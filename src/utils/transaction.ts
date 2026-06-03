import type { Expense, TransactionType } from '@/types';

export function getTransactionType(expense: Expense): TransactionType {
  return expense.type ?? 'expense';
}

export function isExpense(expense: Expense): boolean {
  return getTransactionType(expense) === 'expense';
}

export function isIncome(expense: Expense): boolean {
  return getTransactionType(expense) === 'income';
}

export function onlyExpenses(items: Expense[]): Expense[] {
  return items.filter(isExpense);
}

export function onlyIncome(items: Expense[]): Expense[] {
  return items.filter(isIncome);
}
