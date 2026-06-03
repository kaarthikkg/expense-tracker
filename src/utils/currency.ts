import type { CurrencyCode } from '@/types';

const SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function getCurrencySymbol(code: CurrencyCode): string {
  return SYMBOLS[code];
}

export function formatMoney(amount: number, code: CurrencyCode): string {
  const symbol = getCurrencySymbol(code);
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
