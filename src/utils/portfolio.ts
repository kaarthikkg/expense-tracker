import type { AssetType, Holding } from '@/types';

export const ASSET_TYPE_META: Record<
  AssetType,
  { label: string; color: string }
> = {
  stock: { label: 'Stocks', color: '#5B8CFF' },
  mutual_fund: { label: 'Mutual funds', color: '#8b5cf6' },
  etf: { label: 'ETFs', color: '#06b6d4' },
  crypto: { label: 'Crypto', color: '#f97316' },
  fixed_deposit: { label: 'Fixed deposits', color: '#22c55e' },
  gold: { label: 'Gold', color: '#eab308' },
  other: { label: 'Other', color: '#64748b' },
};

export const ASSET_TYPE_OPTIONS = (Object.keys(ASSET_TYPE_META) as AssetType[]).map(
  (value) => ({
    value,
    label: ASSET_TYPE_META[value].label,
  }),
);

export function holdingInvested(h: Holding): number {
  return h.investedAmount;
}

export function holdingMarketValue(h: Holding): number {
  return h.currentValue;
}

export function holdingGain(h: Holding): number {
  return h.currentValue - h.investedAmount;
}

export function holdingGainPercent(h: Holding): number {
  if (h.investedAmount <= 0) return 0;
  return (holdingGain(h) / h.investedAmount) * 100;
}

export interface PortfolioSummary {
  count: number;
  totalInvested: number;
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
}

export function computePortfolioSummary(holdings: Holding[]): PortfolioSummary {
  let totalInvested = 0;
  let totalValue = 0;
  for (const h of holdings) {
    totalInvested += h.investedAmount;
    totalValue += h.currentValue;
  }
  const totalGain = totalValue - totalInvested;
  const totalGainPercent =
    totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  return {
    count: holdings.length,
    totalInvested,
    totalValue,
    totalGain,
    totalGainPercent,
  };
}

export interface AssetAllocationSlice {
  assetType: AssetType;
  name: string;
  color: string;
  total: number;
}

export function allocationByAssetType(holdings: Holding[]): AssetAllocationSlice[] {
  const map = new Map<AssetType, number>();
  for (const h of holdings) {
    if (h.currentValue <= 0) continue;
    map.set(h.assetType, (map.get(h.assetType) ?? 0) + h.currentValue);
  }
  return Array.from(map.entries())
    .map(([assetType, total]) => ({
      assetType,
      name: ASSET_TYPE_META[assetType].label,
      color: ASSET_TYPE_META[assetType].color,
      total,
    }))
    .sort((a, b) => b.total - a.total);
}
