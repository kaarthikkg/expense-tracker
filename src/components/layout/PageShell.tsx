import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, subtitle, action, children }: PageShellProps) {
  return (
    <div className="flex w-full min-w-0 flex-col page-stack">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full min-w-0 flex-wrap items-end justify-between gap-3"
      >
        <div className="min-w-0 flex-1">
          <p className="type-label-accent hidden sm:block">Command Center</p>
          <h1 className="type-title mt-0 sm:mt-1">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-fg-secondary">{subtitle}</p>
          )}
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
      </motion.header>
      {children}
    </div>
  );
}
