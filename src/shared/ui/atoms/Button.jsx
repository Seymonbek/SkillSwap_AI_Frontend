import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Button Atom - 100/100 Professional Grade
 * Shine effect, ripple animation, smooth transitions
 */

const variants = {
  primary: `
    relative overflow-hidden
    bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600
    text-white font-semibold
    shadow-lg shadow-emerald-500/25
    hover:shadow-xl hover:shadow-emerald-500/30
    active:scale-[0.98]
    before:absolute before:inset-0 
    before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
    before:-translate-x-full before:hover:translate-x-full
    before:transition-transform before:duration-700
  `,
  secondary: `
    bg-slate-800/80 text-slate-100 font-medium
    border border-slate-700/50
    backdrop-blur-sm
    hover:bg-slate-700/80 hover:border-slate-600
    hover:shadow-lg
    active:scale-[0.98]
  `,
  ghost: `
    text-slate-400 font-medium
    hover:text-slate-100 hover:bg-slate-800/50
    active:scale-[0.98]
    backdrop-blur-sm
  `,
  danger: `
    relative overflow-hidden
    bg-gradient-to-r from-red-600 via-red-500 to-red-600
    text-white font-semibold
    shadow-lg shadow-red-500/25
    hover:shadow-xl hover:shadow-red-500/30
    active:scale-[0.98]
  `,
  outline: `
    border-2 border-emerald-500/50 text-emerald-400 font-medium
    hover:bg-emerald-500/10 hover:border-emerald-500
    active:scale-[0.98]
    backdrop-blur-sm
  `,
  glass: `
    glass-card font-medium text-slate-200
    hover:text-white
    active:scale-[0.98]
  `,
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  xl: 'h-14 px-8 text-lg gap-3',
  icon: 'h-10 w-10 p-0',
  'icon-sm': 'h-8 w-8 p-0',
  'icon-lg': 'h-12 w-12 p-0',
};

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  ripple = true,
  ...props
}, ref) => {
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    if (ripple && !disabled && !loading) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }
    props.onClick?.(e);
  };

  return (
    <motion.button
      ref={(node) => {
        buttonRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      disabled={disabled || loading}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple Effects */}
      {ripple && ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
          style={{
            left: ripple.x - 5,
            top: ripple.y - 5,
            width: 10,
            height: 10,
          }}
        />
      ))}

      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 20 : 16} className="animate-spin" />
      ) : (
        <>
          {LeftIcon && <LeftIcon size={size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 20 : 16} />}
          {children}
          {RightIcon && <RightIcon size={size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 20 : 16} />}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';
