import { motion } from 'framer-motion';

interface InsightFeedProps {
  insights: string[];
}

export function InsightFeed({ insights }: InsightFeedProps) {
  if (insights.length === 0) {
    return (
      <p className="text-sm text-fg-muted">
        Intelligence feed activates as you log transactions.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {insights.map((text, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex gap-3 rounded-xl border border-cockpit-border bg-cockpit-elevated/50 px-4 py-3"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-muted text-[10px] font-bold text-accent">
            AI
          </span>
          <span className="text-sm leading-relaxed text-fg-secondary">{text}</span>
        </motion.li>
      ))}
    </ul>
  );
}
