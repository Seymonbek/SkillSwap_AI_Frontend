import React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Skeleton Atom - 100/100 Professional Loading Placeholder
 * Shimmer wave animation with glass effect
 */

export const Skeleton = React.forwardRef(({
  className,
  circle = false,
  shimmer = true,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        'bg-slate-800/60 backdrop-blur-sm',
        circle ? 'rounded-full' : 'rounded-xl',
        className
      )}
      {...props}
    >
      {/* Shimmer wave effect */}
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
          <div className={cn(
            'absolute inset-0',
            'bg-gradient-to-r from-transparent via-white/10 to-transparent',
            circle ? 'rounded-full' : 'rounded-xl'
          )} />
        </div>
      )}
    </div>
  );
});

Skeleton.displayName = 'Skeleton';

// Skeleton variants for common patterns
export const SkeletonText = ({ lines = 1, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className }) => (
  <div className={cn('p-4 space-y-4', className)}>
    <div className="flex items-center gap-3">
      <Skeleton circle className="w-12 h-12" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <Skeleton className="h-20" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

export const SkeletonAvatar = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };
  return <Skeleton circle className={cn(sizes[size], className)} />;
};
