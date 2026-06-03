import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
}

export function ProgressBar({ value, max, color = '#5B8CFF' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = pct > 100;

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, pct)}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full"
        style={{
          background: over
            ? 'linear-gradient(90deg, #dc2626, #d97706)'
            : `linear-gradient(90deg, ${color}, #6366f1)`,
          boxShadow: over ? '0 0 12px #dc262640' : `0 0 12px ${color}40`,
        }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  );
}
