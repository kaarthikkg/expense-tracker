import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney, getCurrencySymbol } from '@/utils/currency';

export function useCurrency() {
  const currency = useSettingsStore((s) => s.settings?.currency ?? 'INR');
  return {
    currency,
    symbol: getCurrencySymbol(currency),
    format: (amount: number) => formatMoney(amount, currency),
  };
}
