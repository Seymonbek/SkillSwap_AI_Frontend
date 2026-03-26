import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

/**
 * Card Molecule - 100/100 Professional Glassmorphism
 */

export const Card = React.forwardRef(({
  children,
  className,
  hover = false,
  padding = 'md',
  onClick,
  gradient = false,
  glow = false,
  ...props
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const cardContent = (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-950/80',
        'backdrop-blur-xl border border-white/[0.08]',
        'shadow-xl shadow-black/20',
        glow && 'hover:shadow-emerald-500/10',
        hover && [
          'hover:border-emerald-500/20',
          'hover:shadow-2xl hover:shadow-emerald-500/5',
          'hover:-translate-y-0.5',
        ],
        onClick && 'cursor-pointer',
        'transition-all duration-300 ease-out',
        paddings[padding],
        className
      )}
      {...props}
    >
      {/* Gradient border effect */}
      {gradient && (
        <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-transparent to-blue-500/20" />
        </div>
      )}

      {/* Inner glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      <div className="relative z-10">{children}</div>
    </div>
  );

  if (hover) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={onClick ? { scale: 0.99 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
});

Card.displayName = 'Card';

export const CardHeader = ({ children, className, action, icon: Icon }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>
    <div className="flex items-center gap-3 flex-1">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
          <Icon size={20} className="text-emerald-400" />
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
    {action && <div className="ml-4">{action}</div>}
  </div>
);

export const CardContent = ({ children, className }) => (
  <div className={cn('', className)}>{children}</div>
);

export const CardFooter = ({ children, className }) => (
  <div className={cn('mt-4 pt-4 border-t border-white/[0.06]', className)}>
    {children}
  </div>
);

// Card with image header
export const CardImage = ({ src, alt, className, overlay }) => (
  <div className={cn('relative h-48 overflow-hidden rounded-t-2xl', className)}>
    <img src={src} alt={alt} className="w-full h-full object-cover" />
    {overlay && (
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
    )}
  </div>
);
