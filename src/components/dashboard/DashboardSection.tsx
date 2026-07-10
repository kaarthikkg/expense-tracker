import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function DashboardSection({
  title,
  subtitle,
  children,
  className = '',
  delay = 0,
}: DashboardSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-panel w-full min-w-0 overflow-hidden rounded-2xl ${className}`}
    >
      <div className="border-b border-cockpit-border px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-fg sm:text-sm">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-fg-muted sm:text-xs">{subtitle}</p>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </motion.section>
  );
}
