import { Link } from 'react-router-dom';
import { useCurrency } from '@/hooks/useCurrency';
import type { NetWorthBreakdown } from '@/utils/netWorth';

interface NetWorthCompactProps {
  data: NetWorthBreakdown;
}

/** One-line net worth context for Portfolio / Loans pages */
export function NetWorthCompact({ data }: NetWorthCompactProps) {
  const { format } = useCurrency();
  const positive = data.netWorth >= 0;

  return (
    <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">
          Your net worth
        </p>
        <p
          className={`font-mono text-2xl font-bold ${positive ? 'text-success' : 'text-danger'}`}
        >
          {format(data.netWorth)}
        </p>
      </div>
      <p className="text-xs text-fg-secondary">
        Assets {format(data.totalAssets)} − Liabilities {format(data.totalLiabilities)}
      </p>
      <Link to="/" className="text-xs font-medium text-accent hover:underline">
        Dashboard →
      </Link>
    </div>
  );
}
