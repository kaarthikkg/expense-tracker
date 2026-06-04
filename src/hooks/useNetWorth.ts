import { useMemo } from 'react';
import { useHoldingStore } from '@/store/holdingStore';
import { useLoanStore } from '@/store/loanStore';
import { computeNetWorth, type NetWorthBreakdown } from '@/utils/netWorth';

export function useNetWorth(): NetWorthBreakdown {
  const holdings = useHoldingStore((s) => s.holdings);
  const loans = useLoanStore((s) => s.loans);
  return useMemo(() => computeNetWorth(holdings, loans), [holdings, loans]);
}
