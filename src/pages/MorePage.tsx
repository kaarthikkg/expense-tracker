import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';

const links = [
  { to: '/categories', label: 'Categories', desc: 'Flow classification' },
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
              className="glass-panel flex items-center justify-between rounded-2xl px-5 py-4 transition hover-surface"
            >
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-fg-muted">{item.desc}</p>
              </div>
              <span className="text-accent">→</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>
    </PageShell>
  );
}
