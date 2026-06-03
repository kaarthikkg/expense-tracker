import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { useCurrency } from '@/hooks/useCurrency';

interface AnimatedMetricProps {
  value: number;
  className?: string;
  showCurrency?: boolean;
}

export function AnimatedMetric({ value, className = '', showCurrency = true }: AnimatedMetricProps) {
  const animated = useAnimatedNumber(value);
  const { format } = useCurrency();

  if (showCurrency) {
    return <span className={className}>{format(animated)}</span>;
  }

  return (
    <span className={className}>
      {Math.round(animated).toLocaleString(undefined, { maximumFractionDigits: 0 })}
    </span>
  );
}
