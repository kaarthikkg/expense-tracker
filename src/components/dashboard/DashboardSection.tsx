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
      className={`glass-panel overflow-hidden rounded-2xl ${className}`}
    >
      <div className="border-b border-cockpit-border px-5 py-4">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-fg-muted">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}
