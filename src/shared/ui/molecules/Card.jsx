import React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Card Molecule - Container for content
 * Used for jobs, users, messages, etc.
 */

export const Card = React.forwardRef(({
  children,
  className,
  hover = false,
  padding = 'md',
  onClick,
  ...props
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'bg-slate-800/50 border border-slate-700/50 rounded-2xl',
        'backdrop-blur-sm',
        hover && 'hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 cursor-pointer',
        onClick && 'cursor-pointer',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = ({ children, className, action }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>
    <div className="flex-1">{children}</div>
    {action && <div className="ml-4">{action}</div>}
  </div>
);

export const CardContent = ({ children, className }) => (
  <div className={cn('', className)}>{children}</div>
);

export const CardFooter = ({ children, className }) => (
  <div className={cn('mt-4 pt-4 border-t border-slate-700/50', className)}>
    {children}
  </div>
);
