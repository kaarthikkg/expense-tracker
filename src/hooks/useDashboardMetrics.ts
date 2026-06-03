import { useMemo } from 'react';
import type { Budget, Category, Expense, SavingsGoal } from '@/types';
import {
  dailyTrendForMonth,
  generateInsights,
  getMonthExpenses,
  getMonthIncome,
  getTodayExpenses,
  spendingByCategory,
  sumExpenses,
  sumIncome,
  topCategory,
} from '@/services/analytics';
import { getDaysInMonth, getMonthKey, parseMonthKey, toDateString } from '@/utils/dates';

export interface DashboardMetrics {
  monthTotal: number;
  monthIncome: number;
  netCashFlow: number;
  todayTotal: number;
  healthScore: number;
  spendingVelocity: number;
  velocityDirection: 'up' | 'down' | 'flat';
  burnRate: number;
  projectedMonth: number;
  savingsMomentum: number;
  topCategoryName: string | null;
  topCategoryTotal: number;
  budgetRemaining: number | null;
  trend: { date: string; total: number }[];
  categoryBreakdown: ReturnType<typeof spendingByCategory>;
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
    const todayExpenses = getTodayExpenses(expenses);
    const monthTotal = sumExpenses(monthExpenseRows);
    const monthIncome = sumIncome(monthIncomeRows);
    const netCashFlow = monthIncome - monthTotal;
    const todayTotal = sumExpenses(todayExpenses);
    const top = topCategory(monthExpenseRows, categories);
    const monthlyBudget = budgets.find((b) => b.month === monthKey && b.categoryId === null);

    const { year, month } = parseMonthKey(monthKey);
    const daysInMonth = getDaysInMonth(year, month);
    const dayOfMonth = new Date().getDate();
    const burnRate = dayOfMonth > 0 ? monthTotal / dayOfMonth : 0;
    const projectedMonth = burnRate * daysInMonth;

    let healthScore = 72;
    if (monthlyBudget && monthlyBudget.amount > 0) {
      const utilization = monthTotal / monthlyBudget.amount;
      healthScore = Math.round(Math.max(15, Math.min(98, 100 - utilization * 55)));
      if (netCashFlow > 0) healthScore = Math.min(98, healthScore + 8);
    } else if (monthTotal === 0) {
      healthScore = monthIncome > 0 ? 90 : 88;
    }

    const last7: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateString(d);
      last7.push(sumExpenses(expenses.filter((e) => e.date === key)));
    }
    const avg7 = last7.reduce((a, b) => a + b, 0) / 7;
    const spendingVelocity = avg7 > 0 ? ((todayTotal - avg7) / avg7) * 100 : 0;
    const velocityDirection: 'up' | 'down' | 'flat' =
      Math.abs(spendingVelocity) < 3
        ? 'flat'
        : spendingVelocity > 0
          ? 'up'
          : 'down';

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
      monthTotal,
      monthIncome,
      netCashFlow,
      todayTotal,
      healthScore,
      spendingVelocity: Math.abs(Math.round(spendingVelocity)),
      velocityDirection,
      burnRate,
      projectedMonth,
      savingsMomentum,
      topCategoryName: top?.name ?? null,
      topCategoryTotal: top?.total ?? 0,
      budgetRemaining: monthlyBudget ? monthlyBudget.amount - monthTotal : null,
      trend: dailyTrendForMonth(expenses, monthKey),
      categoryBreakdown: spendingByCategory(monthExpenseRows, categories),
      insights: generateInsights(expenses, categories),
    };
  }, [expenses, categories, budgets, goals]);
}
