import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<Variant, string> = {
  primary:
    'gradient-accent text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 border border-white/20',
  secondary:
    'bg-cockpit-elevated text-fg border border-cockpit-border-strong hover:bg-surface-hover',
  danger:
    'bg-danger/90 text-white hover:bg-danger border border-danger/40',
  ghost:
    'bg-transparent text-fg-secondary hover:bg-surface-hover hover:text-fg',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  fullWidth,
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizes = {
    sm: 'min-h-10 px-3.5 py-2 text-sm rounded-xl md:min-h-0 md:px-3 md:py-1.5 md:text-xs md:rounded-lg',
    md: 'min-h-11 px-4 py-2.5 text-sm rounded-xl md:min-h-0',
    lg: 'min-h-12 px-6 py-3 text-base rounded-xl md:min-h-0',
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      className={fullWidth ? 'w-full' : 'inline-block'}
    >
      <button
        type="button"
        className={`inline-flex w-full items-center justify-center gap-2 font-medium transition disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {children}
      </button>
    </motion.div>
  );
}
