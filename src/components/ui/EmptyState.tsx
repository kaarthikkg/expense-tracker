import { motion } from 'framer-motion';

interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cockpit-border-strong py-16 text-center"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted">
        <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm text-fg-secondary">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
