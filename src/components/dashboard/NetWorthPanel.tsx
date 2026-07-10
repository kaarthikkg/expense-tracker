import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCurrency } from '@/hooks/useCurrency';
import type { NetWorthBreakdown } from '@/utils/netWorth';

interface NetWorthPanelProps {
  data: NetWorthBreakdown;
}

export function NetWorthPanel({ data }: NetWorthPanelProps) {
  const { format } = useCurrency();
  const positive = data.netWorth >= 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-panel w-full min-w-0 overflow-hidden rounded-2xl"
    >
      <div className="border-b border-cockpit-border bg-gradient-to-br from-accent-muted/40 to-transparent px-4 py-4 sm:px-6 sm:py-5">
        <p className="type-label">Total net worth</p>
        <p
          className={`type-metric-lg amount-fit mt-2 metric-glow ${
            positive ? 'text-success' : 'text-danger'
          }`}
        >
          {format(data.netWorth)}
        </p>
        <p className="mt-2 text-sm text-fg-secondary">
          Investments ({format(data.totalAssets)}) − Loans ({format(data.totalLiabilities)})
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px bg-cockpit-border sm:grid-cols-3">
        <div className="bg-cockpit-panel p-4 sm:p-5">
          <p className="type-label">Assets</p>
          <p className="type-metric amount-fit mt-1.5 text-success">{format(data.totalAssets)}</p>
          <p className="mt-1 text-sm text-fg-muted">
            {data.investmentCount} investment{data.investmentCount === 1 ? '' : 's'}
          </p>
          <Link
            to="/portfolio"
            className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-accent"
          >
            Portfolio →
          </Link>
        </div>

        <div className="bg-cockpit-panel p-4 sm:p-5">
          <p className="type-label">Liabilities</p>
          <p className="type-metric amount-fit mt-1.5 text-danger">
            {format(data.totalLiabilities)}
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            {data.loanCount} loan{data.loanCount === 1 ? '' : 's'} outstanding
          </p>
          <Link
            to="/loans"
            className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-accent"
          >
            Loans →
          </Link>
        </div>

        <div className="bg-cockpit-panel p-4 sm:p-5 sm:block">
          <p className="type-label">Formula</p>
          <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
            Net worth = total current value of investments minus total loan outstanding.
          </p>
          {data.investmentCount === 0 && data.loanCount === 0 && (
            <p className="mt-2 text-sm text-fg-muted">Add portfolio & loans to calculate.</p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
