import { motion } from 'framer-motion';
import {
  useFinanceBackgroundData,
  type FinanceMood,
} from '@/hooks/useFinanceBackgroundData';

const FLOAT_DOTS = [
  { x: '12%', y: '40%', size: 3, delay: 0.2 },
  { x: '28%', y: '28%', size: 2, delay: 1.1 },
  { x: '55%', y: '55%', size: 2.5, delay: 0.7 },
  { x: '85%', y: '38%', size: 2, delay: 1.5 },
  { x: '42%', y: '78%', size: 3, delay: 2.1 },
  { x: '65%', y: '82%', size: 2, delay: 0.4 },
];

function moodClass(mood: FinanceMood): string {
  return `finance-bg--${mood}`;
}

export function FinancialBackground() {
  const { mood, spendPath, incomePath, fillPath, candles, tickers, hasData } =
    useFinanceBackgroundData();

  return (
    <div
      className={`finance-bg pointer-events-none fixed inset-0 z-0 overflow-hidden ${moodClass(mood)}`}
      aria-hidden
    >
      <div className="finance-bg-grid absolute inset-0" />
      <div className="finance-bg-glow finance-bg-glow-a absolute -left-1/4 top-0 h-[55%] w-[70%] rounded-full" />
      <div className="finance-bg-glow finance-bg-glow-b absolute -right-1/4 bottom-0 h-[50%] w-[65%] rounded-full" />

      <svg
        className="absolute inset-x-0 bottom-[8%] h-[42%] w-full opacity-[0.5] dark:opacity-[0.6]"
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="finance-line-a" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--finance-line-a)" stopOpacity="0" />
            <stop offset="15%" stopColor="var(--finance-line-a)" stopOpacity="0.95" />
            <stop offset="85%" stopColor="var(--finance-line-a)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--finance-line-a)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="finance-line-b" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--finance-line-b)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--finance-line-b)" stopOpacity="0.75" />
            <stop offset="80%" stopColor="var(--finance-line-b)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="var(--finance-line-b)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="finance-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--finance-line-a)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--finance-line-a)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.path
          key={`fill-${spendPath}`}
          d={fillPath}
          fill="url(#finance-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <motion.path
          key={`spend-${spendPath}`}
          d={spendPath}
          fill="none"
          stroke="url(#finance-line-a)"
          strokeWidth="2.2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: hasData ? 2.2 : 2.8,
            ease: [0.22, 1, 0.36, 1],
            repeat: Infinity,
            repeatType: 'loop',
            repeatDelay: 2,
          }}
        />
        <motion.path
          key={`income-${incomePath}`}
          d={incomePath}
          fill="none"
          stroke="url(#finance-line-b)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
          initial={{ pathLength: 0, opacity: 0.45 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={{
            duration: hasData ? 2.6 : 3.2,
            delay: 0.25,
            ease: [0.22, 1, 0.36, 1],
            repeat: Infinity,
            repeatType: 'loop',
            repeatDelay: 2.4,
          }}
        />
      </svg>

      <div className="absolute inset-x-[6%] bottom-[12%] flex h-[28%] items-end justify-between gap-1 opacity-[0.28] dark:opacity-[0.34] md:inset-x-[10%]">
        {candles.map((c, i) => (
          <motion.div
            key={`${i}-${c.h}-${c.up}`}
            className="relative flex w-full max-w-[14px] flex-col items-center"
            initial={{ scaleY: 0.25, opacity: 0 }}
            animate={{
              scaleY: hasData ? [0.7, 1, 0.85, 1] : [0.55, 1, 0.7, 1],
              opacity: [0.35, 0.95, 0.55, 0.85],
            }}
            transition={{
              duration: 3.8 + (i % 5) * 0.3,
              delay: i * 0.08,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ originY: 1, height: `${c.h}%` }}
          >
            <div
              className="w-px flex-1"
              style={{
                background: c.up ? 'var(--finance-candle-up)' : 'var(--finance-candle-down)',
              }}
            />
            <div
              className="w-[55%] rounded-[2px]"
              style={{
                height: `${c.body}%`,
                background: c.up ? 'var(--finance-candle-up)' : 'var(--finance-candle-down)',
              }}
            />
            <div
              className="w-px flex-1"
              style={{
                background: c.up ? 'var(--finance-candle-up)' : 'var(--finance-candle-down)',
              }}
            />
          </motion.div>
        ))}
      </div>

      {tickers.map((t) => (
        <motion.span
          key={t.label}
          className="finance-bg-ticker absolute font-mono text-[10px] font-medium tracking-[0.14em] uppercase md:text-[11px]"
          style={{ left: t.x, top: t.y }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: [0.2, 0.55, 0.25], y: [0, -8, 0] }}
          transition={{
            duration: 7,
            delay: t.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {t.label}
        </motion.span>
      ))}

      {FLOAT_DOTS.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: d.x,
            top: d.y,
            width: d.size,
            height: d.size,
            background: 'var(--finance-dot)',
          }}
          animate={{
            y: [0, -14, 0],
            opacity: [0.2, 0.55, 0.25],
            scale: [1, 1.35, 1],
          }}
          transition={{
            duration: 5.5 + i * 0.4,
            delay: d.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <motion.div
        className="finance-bg-scan absolute inset-x-0 h-24"
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
