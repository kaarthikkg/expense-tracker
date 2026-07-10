import { useMemo } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useExpenseStore } from '@/store/expenseStore';
import {
  getMonthExpenses,
  getMonthIncome,
  sumExpenses,
  sumIncome,
  topCategory,
} from '@/services/analytics';
import { getMonthKey, getMonthRange, toDateString } from '@/utils/dates';
import { formatMoney } from '@/utils/currency';
import { useSettingsStore } from '@/store/settingsStore';

export type FinanceMood = 'surplus' | 'balanced' | 'deficit' | 'overBudget' | 'empty';

export interface FinanceCandle {
  h: number;
  body: number;
  up: boolean;
}

export interface FinanceTicker {
  label: string;
  x: string;
  y: string;
  delay: number;
}

export interface FinanceBackgroundData {
  mood: FinanceMood;
  spendPath: string;
  incomePath: string;
  fillPath: string;
  candles: FinanceCandle[];
  tickers: FinanceTicker[];
  hasData: boolean;
}

const VIEW_W = 800;
const VIEW_H = 200;
const PAD = 28;

function dailyTotals(
  rows: { date: string; amount: number }[],
  monthKey: string,
): number[] {
  const { start, end } = getMonthRange(monthKey);
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.date.slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }
  const totals: number[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cursor <= last) {
    totals.push(map.get(toDateString(cursor)) ?? 0);
    cursor.setDate(cursor.getDate() + 1);
  }
  return totals;
}

/** Smooth cubic path from daily values (higher spend → lower on chart). */
function valuesToPath(values: number[], invert = false): string {
  if (values.length === 0) {
    return `M0 ${VIEW_H * 0.65} L${VIEW_W} ${VIEW_H * 0.65}`;
  }
  const max = Math.max(...values, 1);
  const n = values.length;
  const pts = values.map((v, i) => {
    const x = n === 1 ? VIEW_W / 2 : (i / (n - 1)) * VIEW_W;
    const ratio = v / max;
    const y = invert
      ? PAD + ratio * (VIEW_H - PAD * 2)
      : VIEW_H - PAD - ratio * (VIEW_H - PAD * 2);
    return { x, y };
  });

  if (pts.length === 1) {
    return `M0 ${pts[0].y} L${VIEW_W} ${pts[0].y}`;
  }

  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const cpx = ((a.x + b.x) / 2).toFixed(1);
    d += ` C${cpx} ${a.y.toFixed(1)} ${cpx} ${b.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}

function compactAmount(amount: number, currency: Parameters<typeof formatMoney>[1]): string {
  const abs = Math.abs(amount);
  const value = abs >= 100_000 ? Math.round(amount / 1000) * 1000 : amount;
  return formatMoney(value, currency);
}

const FALLBACK_CANDLES: FinanceCandle[] = Array.from({ length: 20 }, (_, i) => ({
  h: 35 + ((i * 17) % 40),
  body: 28 + ((i * 11) % 25),
  up: i % 3 !== 0,
}));

export function useFinanceBackgroundData(): FinanceBackgroundData {
  const expenses = useExpenseStore((s) => s.expenses);
  const categories = useCategoryStore((s) => s.categories);
  const budgets = useBudgetStore((s) => s.budgets);
  const currency = useSettingsStore((s) => s.settings?.currency ?? 'INR');

  return useMemo(() => {
    const monthKey = getMonthKey();
    const monthExpenseRows = getMonthExpenses(expenses, monthKey);
    const monthIncomeRows = getMonthIncome(expenses, monthKey);
    const spent = sumExpenses(monthExpenseRows);
    const income = sumIncome(monthIncomeRows);
    const net = income - spent;
    const top = topCategory(monthExpenseRows, categories);
    const monthlyBudget = budgets.find((b) => b.month === monthKey && b.categoryId === null);
    const burnPct =
      monthlyBudget && monthlyBudget.amount > 0
        ? Math.round((spent / monthlyBudget.amount) * 100)
        : null;

    const spendDays = dailyTotals(monthExpenseRows, monthKey);
    const incomeDays = dailyTotals(monthIncomeRows, monthKey);
    const hasData = spent > 0 || income > 0;

    const spendPath = valuesToPath(hasData ? spendDays : softWave(0.55));
    const incomePath = valuesToPath(hasData ? incomeDays : softWave(0.35), false);
    const fillPath = `${spendPath} L${VIEW_W} ${VIEW_H} L0 ${VIEW_H} Z`;

    const step = Math.max(1, Math.floor(spendDays.length / 22));
    const sample = spendDays.filter((_, i) => i % step === 0);
    const candleSource = sample.length >= 4 ? sample : spendDays;
    const candleMax = Math.max(...candleSource, 1);
    const candles: FinanceCandle[] = hasData
      ? candleSource.slice(-24).map((v, i, arr) => {
          const prev = i > 0 ? arr[i - 1] : v;
          const h = 28 + (v / candleMax) * 72;
          const body = 18 + (Math.abs(v - prev) / candleMax) * 42;
          return {
            h: Math.min(100, h),
            body: Math.min(h * 0.75, Math.max(14, body)),
            // green when spend fell vs prior day
            up: v <= prev,
          };
        })
      : FALLBACK_CANDLES;

    let mood: FinanceMood = 'empty';
    if (hasData) {
      if (burnPct !== null && burnPct >= 100) mood = 'overBudget';
      else if (net > 0) mood = 'surplus';
      else if (net < 0) mood = 'deficit';
      else mood = 'balanced';
    }

    const tickers: FinanceTicker[] = hasData
      ? [
          { label: `SPENT ${compactAmount(spent, currency)}`, x: '7%', y: '16%', delay: 0 },
          { label: `IN ${compactAmount(income, currency)}`, x: '68%', y: '20%', delay: 1.1 },
          {
            label: `NET ${net >= 0 ? '+' : ''}${compactAmount(net, currency)}`,
            x: '14%',
            y: '72%',
            delay: 2.2,
          },
          {
            label: top ? `TOP ${top.name.toUpperCase().slice(0, 12)}` : 'TOP —',
            x: '74%',
            y: '66%',
            delay: 0.5,
          },
          {
            label:
              burnPct !== null
                ? `BURN ${Math.min(burnPct, 999)}%`
                : `FLOW ${monthKey.slice(5)}`,
            x: '44%',
            y: '11%',
            delay: 1.6,
          },
        ]
      : [
          { label: 'SPENT —', x: '8%', y: '18%', delay: 0 },
          { label: 'IN —', x: '72%', y: '22%', delay: 1.2 },
          { label: 'ADD FLOW', x: '18%', y: '68%', delay: 2.4 },
          { label: 'TRACK', x: '78%', y: '62%', delay: 0.6 },
          { label: 'LIVE', x: '48%', y: '12%', delay: 1.8 },
        ];

    return {
      mood,
      spendPath,
      incomePath,
      fillPath,
      candles,
      tickers,
      hasData,
    };
  }, [expenses, categories, budgets, currency]);
}

/** Gentle placeholder wave when the month has no transactions yet. */
function softWave(amp: number): number[] {
  return Array.from({ length: 28 }, (_, i) => {
    const t = i / 27;
    return 0.35 + amp * (0.5 + 0.5 * Math.sin(t * Math.PI * 2.2 + 0.4));
  });
}
