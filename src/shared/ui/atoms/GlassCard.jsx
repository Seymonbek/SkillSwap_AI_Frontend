import { cn } from '@/shared/lib/utils';
import { forwardRef } from 'react';

export const GlassCard = forwardRef(({ children, className, hover = true, glow = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-slate-800/60 to-slate-900/80',
        'backdrop-blur-xl border border-white/[0.08]',
        'shadow-lg shadow-black/20',
        hover && 'transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-500/20',
        glow && 'hover:shadow-emerald-500/10',
        className
      )}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      {children}
    </div>
  );
});
GlassCard.displayName = 'GlassCard';
