import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';

const links = [
  { to: '/categories', label: 'Categories', desc: 'Flow classification' },
  { to: '/accounts', label: 'Cards & banks', desc: 'Transaction source tagging' },
  { to: '/portfolio', label: 'Portfolio', desc: 'Holdings & investment P&L' },
  { to: '/loans', label: 'Loans', desc: 'Outstanding, EMI & repayment' },
  { to: '/ev', label: 'EV usage & savings', desc: 'Odometer, km driven & fuel savings' },
  { to: '/goals', label: 'Savings Momentum', desc: 'Target tracking' },
  { to: '/recurring', label: 'Recurring', desc: 'Automated flows' },
  { to: '/reports', label: 'Analytics', desc: 'Deep intelligence' },
  { to: '/settings', label: 'System', desc: 'Preferences & data' },
];

export function MorePage() {
  return (
    <PageShell title="More" subtitle="Extended terminal modules">
      <nav className="space-y-2">
        {links.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <NavLink
              to={item.to}
              className="glass-panel flex min-h-16 items-center justify-between rounded-2xl px-4 py-4 transition hover-surface sm:px-5"
            >
              <div>
                <p className="text-base font-medium sm:text-sm">{item.label}</p>
                <p className="mt-0.5 text-sm text-fg-muted sm:text-xs">{item.desc}</p>
              </div>
              <span className="text-lg text-accent">→</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>
    </PageShell>
  );
}
