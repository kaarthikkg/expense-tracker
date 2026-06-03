import { motion } from 'framer-motion';

interface HealthScoreWidgetProps {
  score: number;
}

export function HealthScoreWidget({ score }: HealthScoreWidgetProps) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke="var(--track)"
            strokeWidth="8"
          />
          <motion.circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke="url(#healthGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5B8CFF" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={score}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-mono text-4xl font-bold tracking-tight text-fg metric-glow"
          >
            {score}
          </motion.span>
          <span className="text-[10px] uppercase tracking-widest text-fg-muted">/ 100</span>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-fg-secondary">
        Composite of budget discipline & spend patterns
      </p>
    </div>
  );
}
