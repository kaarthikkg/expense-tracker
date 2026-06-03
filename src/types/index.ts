export type TransactionType = 'expense' | 'income';

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  createdAt: string;
  /** Omit on legacy rows — treated as `expense` */
  type?: TransactionType;
}

export type CategoryKind = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  color: string;
  /** When set, category is suggested only for that type in transaction forms */
  kind?: CategoryKind;
}

export interface Budget {
  id: string;
  categoryId: string | null;
  amount: number;
  month: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringExpense {
  id: string;
  amount: number;
  categoryId: string;
  description: string;
  frequency: RecurringFrequency;
  startDate: string;
  lastGeneratedDate: string | null;
  isActive: boolean;
}

export type Theme = 'light' | 'dark' | 'system';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface AppSettings {
  id: 'app';
  theme: Theme;
  currency: CurrencyCode;
}

export interface ExportData {
  version: number;
  exportedAt: string;
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  recurringExpenses: RecurringExpense[];
  settings: AppSettings;
}
