import React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Button Atom - Upwork/Fiverr style
 * Primary, secondary, ghost, danger variants
 * Multiple sizes with mobile-first approach
 */

const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-lg shadow-emerald-600/20',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
  ghost: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20',
  outline: 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600/10',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  xl: 'h-14 px-8 text-lg',
  icon: 'h-10 w-10 p-0',
};

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200',
        'active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';
