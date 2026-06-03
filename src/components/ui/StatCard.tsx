import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'default' | 'success' | 'warning' | 'danger';
}

const accentColors = {
  default: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass-panel rounded-2xl p-5">
      <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">
        {label}
      </p>
      <p
        className={`mt-2 font-mono text-2xl font-semibold tracking-tight metric-glow sm:text-3xl ${accentColors[accent]}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-fg-secondary">{sub}</p>}
    </motion.div>
  );
}
