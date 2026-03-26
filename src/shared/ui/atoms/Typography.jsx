import React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Typography Atom - Text styles for the entire app
 */

export const Typography = {
  H1: ({ children, className, ...props }) => (
    <h1 className={cn('text-3xl md:text-4xl font-bold text-slate-100', className)} {...props}>
      {children}
    </h1>
  ),
  H2: ({ children, className, ...props }) => (
    <h2 className={cn('text-2xl md:text-3xl font-bold text-slate-100', className)} {...props}>
      {children}
    </h2>
  ),
  H3: ({ children, className, ...props }) => (
    <h3 className={cn('text-xl md:text-2xl font-semibold text-slate-100', className)} {...props}>
      {children}
    </h3>
  ),
  H4: ({ children, className, ...props }) => (
    <h4 className={cn('text-lg md:text-xl font-semibold text-slate-200', className)} {...props}>
      {children}
    </h4>
  ),
  Body: ({ children, className, muted = false, ...props }) => (
    <p className={cn('text-base text-slate-300', muted && 'text-slate-500', className)} {...props}>
      {children}
    </p>
  ),
  Small: ({ children, className, muted = false, ...props }) => (
    <span className={cn('text-sm text-slate-400', muted && 'text-slate-600', className)} {...props}>
      {children}
    </span>
  ),
};
