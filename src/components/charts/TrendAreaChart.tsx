import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DaySpend } from '@/services/analytics';
import { useCurrency } from '@/hooks/useCurrency';
import { useChartTheme } from '@/hooks/useChartTheme';

interface TrendAreaChartProps {
  data: DaySpend[];
  height?: number;
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  format: (n: number) => string;
}) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="glass-panel rounded-xl px-3 py-2 text-xs">
      <p className="text-fg-muted">{label}</p>
      <p className="font-mono font-semibold text-accent">{format(payload[0].value)}</p>
    </div>
  );
}

export function TrendAreaChart({ data, height = 240 }: TrendAreaChartProps) {
  const { format } = useCurrency();
  const { grid, tick } = useChartTheme();

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-fg-muted">
        Awaiting transaction data
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B8CFF" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#5B8CFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: tick, fontSize: 10 }}
            tickFormatter={(v: string) => v.slice(8)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<ChartTooltip format={format} />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#5B8CFF"
            strokeWidth={2}
            fill="url(#areaGradient)"
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
