import type { Holding, Loan } from '@/types';

export interface NetWorthBreakdown {
  /** Sum of portfolio current values */
  totalAssets: number;
  /** Sum of loan outstanding balances */
  totalLiabilities: number;
  /** Assets − liabilities */
  netWorth: number;
  investmentCount: number;
  loanCount: number;
}

export function computeNetWorth(holdings: Holding[], loans: Loan[]): NetWorthBreakdown {
  const totalAssets = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalLiabilities = loans.reduce((sum, l) => sum + l.outstandingAmount, 0);
  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    investmentCount: holdings.length,
    loanCount: loans.length,
  };
}
