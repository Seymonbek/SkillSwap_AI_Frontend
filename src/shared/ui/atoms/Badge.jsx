import React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Badge Atom - Status indicators and labels
 */

export const Badge = React.forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-slate-700 text-slate-200',
    primary: 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30',
    success: 'bg-green-600/20 text-green-400 border border-green-600/30',
    warning: 'bg-amber-600/20 text-amber-400 border border-amber-600/30',
    danger: 'bg-red-600/20 text-red-400 border border-red-600/30',
    info: 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
