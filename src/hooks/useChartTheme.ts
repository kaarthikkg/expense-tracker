import { useEffect, useState } from 'react';

export function useChartTheme() {
  const [colors, setColors] = useState(() => readChartColors());

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setColors(readChartColors());
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', sync);
    return () => {
      obs.disconnect();
      mq.removeEventListener('change', sync);
    };
  }, []);

  return colors;
}

function readChartColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    grid: style.getPropertyValue('--chart-grid').trim() || 'rgba(15,23,42,0.08)',
    tick: style.getPropertyValue('--fg-muted').trim() || '#64748b',
  };
}
