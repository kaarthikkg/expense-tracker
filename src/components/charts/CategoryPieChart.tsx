import { motion } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySpend } from '@/services/analytics';
import { useCurrency } from '@/hooks/useCurrency';

interface CategoryPieChartProps {
  data: CategorySpend[];
  monthKey?: string;
  emptyLabel?: string;
  height?: number;
  /** When set, remaining categories are grouped (default: show every category). */
  maxSlices?: number;
}

interface PieSlice {
  categoryId: string;
  name: string;
  value: number;
  color: string;
  percent: number;
  grouped?: CategorySpend[];
}

function buildSlices(data: CategorySpend[], maxSlices?: number): PieSlice[] {
  const positive = data.filter((d) => d.total > 0);
  const total = positive.reduce((s, d) => s + d.total, 0);
  if (total <= 0) return [];

  const limit = maxSlices ?? positive.length;
  const top = positive.slice(0, limit);
  const rest = positive.slice(limit);

  const sliceItems: Array<CategorySpend & { grouped?: CategorySpend[] }> =
    rest.length > 0
      ? [
          ...top,
          {
            categoryId: '__grouped__',
            name: `More categories (${rest.length})`,
            color: '#64748b',
            total: rest.reduce((s, d) => s + d.total, 0),
            grouped: rest,
          },
        ]
      : top;

  return sliceItems.map((item) => ({
    categoryId: item.categoryId,
    name: item.name,
    value: item.total,
    color: item.color,
    percent: (item.total / total) * 100,
    grouped: item.grouped,
  }));
}

function PieTooltip({
  active,
  payload,
  format,
}: {
  active?: boolean;
  payload?: { payload: PieSlice }[];
  format: (n: number) => string;
}) {
  if (!active || !payload?.[0]) return null;
  const slice = payload[0].payload;
  return (
    <div className="glass-panel max-w-xs rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-fg">{slice.name}</p>
      <p className="font-mono font-semibold text-accent">{format(slice.value)}</p>
      <p className="text-fg-muted">{slice.percent.toFixed(1)}% of spending</p>
      {slice.grouped && slice.grouped.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-cockpit-border pt-2">
          {slice.grouped.map((item) => (
            <li key={item.categoryId} className="flex justify-between gap-3 text-fg-secondary">
              <span>{item.name}</span>
              <span className="font-mono">{format(item.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CategoryPieChart({
  data,
  monthKey = '',
  emptyLabel = 'No spending this month yet',
  height = 260,
  maxSlices,
}: CategoryPieChartProps) {
  const { format } = useCurrency();
  const slices = buildSlices(data, maxSlices);
  const total = slices.reduce((s, d) => s + d.value, 0);
  const chartKey = `${monthKey}-${slices.map((s) => `${s.categoryId}:${s.value}`).join('|')}`;

  if (slices.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-fg-muted"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-[280px] shrink-0 lg:mx-0"
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart key={chartKey}>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="88%"
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="transparent"
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.categoryId} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip format={format} />} />
          </PieChart>
        </ResponsiveContainer>
        <p className="-mt-2 text-center font-mono text-xs text-fg-muted">
          Total {format(total)}
        </p>
      </motion.div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {slices.map((slice, i) => (
          <li key={slice.categoryId}>
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-fg">{slice.name}</span>
              <span className="shrink-0 font-mono text-xs text-fg-secondary">
                {slice.percent.toFixed(0)}%
              </span>
              <span className="shrink-0 font-mono text-xs font-medium text-fg">
                {format(slice.value)}
              </span>
            </motion.div>
            {slice.grouped && (
              <ul className="mt-1.5 space-y-1 border-l-2 border-cockpit-border pl-4 ml-1">
                {slice.grouped.map((item) => (
                  <li
                    key={item.categoryId}
                    className="flex items-center gap-2 text-xs text-fg-muted"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="font-mono">{format(item.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
