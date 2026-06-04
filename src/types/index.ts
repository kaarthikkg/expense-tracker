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

export type AssetType =
  | 'stock'
  | 'mutual_fund'
  | 'etf'
  | 'crypto'
  | 'fixed_deposit'
  | 'gold'
  | 'other';

export interface Holding {
  id: string;
  /** Where you invested (fund, broker, asset label) */
  name: string;
  assetType: AssetType;
  /** Total amount put in */
  investedAmount: number;
  /** Current total value */
  currentValue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LoanType =
  | 'home'
  | 'personal'
  | 'car'
  | 'education'
  | 'credit_card'
  | 'business'
  | 'other';

export interface Loan {
  id: string;
  /** Lender or loan label */
  name: string;
  loanType: LoanType;
  /** Original borrowed amount */
  principalAmount: number;
  /** Current balance left */
  outstandingAmount: number;
  /** Omit or 0 when there is no fixed monthly EMI */
  monthlyEmi?: number;
  /** Annual interest % (optional) */
  interestRate?: number;
  startDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportData {
  version: number;
  exportedAt: string;
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  recurringExpenses: RecurringExpense[];
  holdings?: Holding[];
  loans?: Loan[];
  settings: AppSettings;
}
