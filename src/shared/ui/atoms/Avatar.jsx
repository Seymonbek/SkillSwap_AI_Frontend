import React from 'react';
import { cn, getInitials } from '@/shared/lib/utils';

/**
 * Avatar Atom - User profile image with fallback
 */

export const Avatar = React.forwardRef(({
  src,
  alt,
  name,
  size = 'md',
  online = false,
  className,
  ...props
}, ref) => {
  const [error, setError] = React.useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const onlineIndicatorSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
  };

  return (
    <div ref={ref} className={cn('relative inline-flex', className)} {...props}>
      <div className={cn(
        'rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600',
        'flex items-center justify-center text-white font-semibold',
        sizes[size]
      )}>
        {!error && src ? (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {online && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full bg-emerald-500 border-2 border-slate-900',
          onlineIndicatorSizes[size]
        )} />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';
