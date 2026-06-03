import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-medium text-fg-secondary">{label}</span>}
      <select
        className={`rounded-xl border border-cockpit-border-strong bg-cockpit-panel px-3.5 py-2.5 text-fg shadow-sm outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/25 dark:bg-cockpit-elevated/80 dark:shadow-none ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-cockpit-panel text-fg">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
