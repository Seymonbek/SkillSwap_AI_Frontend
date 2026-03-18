import React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Input Atom - Professional form input
 */

export const Input = React.forwardRef(({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  fullWidth = false,
  size = 'md',
  ...props
}, ref) => {
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-13 px-5 text-lg',
  };

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-slate-800 border border-slate-700 rounded-xl',
            'text-slate-100 placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500',
            'transition-all duration-200',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            sizes[size]
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
      {helper && !error && (
        <span className="text-xs text-slate-500">{helper}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
