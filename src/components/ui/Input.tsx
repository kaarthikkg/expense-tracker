import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-medium text-fg-secondary">{label}</span>}
      <input
        id={inputId}
        className={`rounded-xl border border-cockpit-border-strong bg-cockpit-panel px-3.5 py-2.5 text-fg shadow-sm outline-none transition placeholder:text-fg-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/25 dark:bg-cockpit-elevated/80 dark:shadow-none ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
