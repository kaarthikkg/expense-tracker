import type { Loan, LoanType } from '@/types';

export const LOAN_TYPE_META: Record<LoanType, { label: string; color: string }> = {
  home: { label: 'Home loan', color: '#5B8CFF' },
  personal: { label: 'Personal loan', color: '#8b5cf6' },
  car: { label: 'Car loan', color: '#06b6d4' },
  education: { label: 'Education loan', color: '#22c55e' },
  credit_card: { label: 'Credit card', color: '#f97316' },
  business: { label: 'Business loan', color: '#eab308' },
  other: { label: 'Other', color: '#64748b' },
};

export const LOAN_TYPE_OPTIONS = (Object.keys(LOAN_TYPE_META) as LoanType[]).map((value) => ({
  value,
  label: LOAN_TYPE_META[value].label,
}));

export function loanRepaid(loan: Loan): number {
  return Math.max(0, loan.principalAmount - loan.outstandingAmount);
}

export function loanRepaidPercent(loan: Loan): number {
  if (loan.principalAmount <= 0) return 0;
  return Math.min(100, (loanRepaid(loan) / loan.principalAmount) * 100);
}

export function loanHasEmi(loan: Loan): boolean {
  return (loan.monthlyEmi ?? 0) > 0;
}

export interface LoansSummary {
  count: number;
  withEmiCount: number;
  totalPrincipal: number;
  totalOutstanding: number;
  totalRepaid: number;
  totalMonthlyEmi: number;
  repaidPercent: number;
}

export function computeLoansSummary(loans: Loan[]): LoansSummary {
  let totalPrincipal = 0;
  let totalOutstanding = 0;
  let totalMonthlyEmi = 0;
  let withEmiCount = 0;

  for (const loan of loans) {
    totalPrincipal += loan.principalAmount;
    totalOutstanding += loan.outstandingAmount;
    if (loanHasEmi(loan)) {
      withEmiCount++;
      totalMonthlyEmi += loan.monthlyEmi!;
    }
  }

  const totalRepaid = Math.max(0, totalPrincipal - totalOutstanding);
  const repaidPercent =
    totalPrincipal > 0 ? (totalRepaid / totalPrincipal) * 100 : 0;

  return {
    count: loans.length,
    withEmiCount,
    totalPrincipal,
    totalOutstanding,
    totalRepaid,
    totalMonthlyEmi,
    repaidPercent,
  };
}

export interface LoanTypeSlice {
  loanType: LoanType;
  name: string;
  color: string;
  total: number;
}

export function outstandingByLoanType(loans: Loan[]): LoanTypeSlice[] {
  const map = new Map<LoanType, number>();
  for (const loan of loans) {
    if (loan.outstandingAmount <= 0) continue;
    map.set(loan.loanType, (map.get(loan.loanType) ?? 0) + loan.outstandingAmount);
  }
  return Array.from(map.entries())
    .map(([loanType, total]) => ({
      loanType,
      name: LOAN_TYPE_META[loanType].label,
      color: LOAN_TYPE_META[loanType].color,
      total,
    }))
    .sort((a, b) => b.total - a.total);
}
