import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Search } from 'lucide-react';

/**
 * SearchBar Molecule - Global search with autocomplete feel
 */

export const SearchBar = React.forwardRef(({
  value,
  onChange,
  onSubmit,
  placeholder = 'Qidirish...',
  className,
  loading = false,
  ...props
}, ref) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        <Search size={18} />
      </div>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full h-11 pl-10 pr-4',
          'bg-slate-800/80 border border-slate-700 rounded-full',
          'text-slate-100 placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500',
          'transition-all duration-200'
        )}
        {...props}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </form>
  );
});

SearchBar.displayName = 'SearchBar';
