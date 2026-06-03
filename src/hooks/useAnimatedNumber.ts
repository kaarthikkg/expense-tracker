import { useEffect, useState } from 'react';

export function useAnimatedNumber(value: number, duration = 600): number {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(start + diff * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [value, duration]);

  useEffect(() => {
    if (Math.abs(display - value) < 0.01 && value !== display) {
      setDisplay(value);
    }
  }, [value, display]);

  return display;
}
