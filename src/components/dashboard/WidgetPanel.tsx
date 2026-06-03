import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface WidgetPanelProps {
  label: string;
  children: ReactNode;
  className?: string;
  span?: 'default' | 'wide' | 'tall';
  delay?: number;
}

export function WidgetPanel({
  label,
  children,
  className = '',
  span = 'default',
  delay = 0,
}: WidgetPanelProps) {
  const spanClass =
    span === 'wide' ? 'md:col-span-2' : span === 'tall' ? 'md:row-span-2' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={`glass-panel flex flex-col rounded-2xl ${spanClass} ${className}`}
    >
      <div className="border-b border-cockpit-border px-5 py-3">
        <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">
          {label}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </motion.div>
  );
}
