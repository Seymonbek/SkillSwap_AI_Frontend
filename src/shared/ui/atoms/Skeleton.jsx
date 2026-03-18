import React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Skeleton Atom - Loading placeholder with shimmer effect
 */

export const Skeleton = React.forwardRef(({
  className,
  circle = false,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'animate-pulse bg-slate-800',
        circle ? 'rounded-full' : 'rounded-lg',
        className
      )}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';
