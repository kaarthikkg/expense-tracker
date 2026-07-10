import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export function Card({
  title,
  subtitle,
  children,
  className = '',
  action,
  noPadding,
}: CardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-panel w-full min-w-0 overflow-hidden rounded-2xl ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-cockpit-border px-4 py-4 sm:px-5">
          <div>
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-fg sm:text-sm">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-fg-muted sm:text-xs">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-5'}>{children}</div>
    </motion.section>
  );
}
