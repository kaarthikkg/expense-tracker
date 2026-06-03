import { motion } from 'framer-motion';
import type { CategorySpend } from '@/services/analytics';
import { useCurrency } from '@/hooks/useCurrency';

interface CategoryBarsChartProps {
  data: CategorySpend[];
}

export function CategoryBarsChart({ data }: CategoryBarsChartProps) {
  const { format } = useCurrency();
  const max = data[0]?.total ?? 1;

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-fg-muted">
        No category flow this period
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.slice(0, 6).map((item, i) => (
        <motion.div
          key={item.categoryId}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-medium text-fg">{item.name}</span>
            <span className="font-mono text-fg-secondary">{format(item.total)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-track">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.total / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${item.color}, ${item.color}99)`,
                boxShadow: `0 0 12px ${item.color}33`,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
