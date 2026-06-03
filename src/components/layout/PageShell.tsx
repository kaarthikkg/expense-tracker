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
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
            Command Center
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-fg-secondary">{subtitle}</p>
          )}
        </div>
        {action}
      </motion.header>
      {children}
    </div>
  );
}
