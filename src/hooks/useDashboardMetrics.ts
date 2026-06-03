import { useMemo } from 'react';
import type { Budget, Category, Expense, SavingsGoal } from '@/types';
import {
  dailyTrendForMonth,
  generateInsights,
  getMonthExpenses,
  getMonthIncome,
  monthSpendingByCategory,
  sumExpenses,
  sumIncome,
  topCategory,
} from '@/services/analytics';
import { formatMonthLabel, getMonthKey } from '@/utils/dates';

export interface DashboardMetrics {
  monthKey: string;
  monthLabel: string;
  monthTotal: number;
  monthIncome: number;
  netCashFlow: number;
  savingsMomentum: number;
  topCategoryName: string | null;
  topCategoryTotal: number;
  budgetRemaining: number | null;
  trend: { date: string; total: number }[];
  categoryBreakdown: ReturnType<typeof monthSpendingByCategory>;
  insights: string[];
}

export function useDashboardMetrics(
  expenses: Expense[],
  categories: Category[],
  budgets: Budget[],
  goals: SavingsGoal[],
): DashboardMetrics {
  return useMemo(() => {
    const monthKey = getMonthKey();
    const monthExpenseRows = getMonthExpenses(expenses, monthKey);
    const monthIncomeRows = getMonthIncome(expenses, monthKey);
    const monthTotal = sumExpenses(monthExpenseRows);
    const monthIncome = sumIncome(monthIncomeRows);
    const netCashFlow = monthIncome - monthTotal;
    const top = topCategory(monthExpenseRows, categories);
    const monthlyBudget = budgets.find((b) => b.month === monthKey && b.categoryId === null);

    const savingsMomentum =
      goals.length === 0
        ? 0
        : Math.round(
            (goals.reduce(
              (s, g) => s + (g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0),
              0,
            ) /
              goals.length) *
              100,
          );

    return {
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      monthTotal,
      monthIncome,
      netCashFlow,
      savingsMomentum,
      topCategoryName: top?.name ?? null,
      topCategoryTotal: top?.total ?? 0,
      budgetRemaining: monthlyBudget ? monthlyBudget.amount - monthTotal : null,
      trend: dailyTrendForMonth(expenses, monthKey),
      categoryBreakdown: monthSpendingByCategory(expenses, categories, monthKey),
      insights: generateInsights(expenses, categories),
    };
  }, [expenses, categories, budgets, goals]);
}
