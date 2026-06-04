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
      className="glass-panel overflow-hidden rounded-2xl"
    >
      <div className="border-b border-cockpit-border bg-gradient-to-br from-accent-muted/40 to-transparent px-5 py-4 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">
          Total net worth
        </p>
        <p
          className={`mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl metric-glow ${
            positive ? 'text-success' : 'text-danger'
          }`}
        >
          {format(data.netWorth)}
        </p>
        <p className="mt-1 text-xs text-fg-secondary">
          Investments ({format(data.totalAssets)}) − Loans ({format(data.totalLiabilities)})
        </p>
      </div>

      <div className="grid gap-px bg-cockpit-border sm:grid-cols-3">
        <div className="bg-cockpit-panel p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">
            Assets
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-success">
            {format(data.totalAssets)}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            {data.investmentCount} investment{data.investmentCount === 1 ? '' : 's'}
          </p>
          <Link to="/portfolio" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
            Portfolio →
          </Link>
        </div>

        <div className="bg-cockpit-panel p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">
            Liabilities
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-danger">
            {format(data.totalLiabilities)}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            {data.loanCount} loan{data.loanCount === 1 ? '' : 's'} outstanding
          </p>
          <Link to="/loans" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
            Loans →
          </Link>
        </div>

        <div className="bg-cockpit-panel p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">
            Formula
          </p>
          <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
            Net worth = total current value of investments minus total loan outstanding.
          </p>
          {data.investmentCount === 0 && data.loanCount === 0 && (
            <p className="mt-2 text-xs text-fg-muted">Add portfolio & loans to calculate.</p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
