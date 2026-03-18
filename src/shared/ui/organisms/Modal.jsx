import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/atoms/Button';
import { X } from 'lucide-react';

/**
 * Modal Organism - Overlay dialog
 */

export const Modal = React.forwardRef(({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  ...props
}, ref) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[calc(100vw-2rem)]',
  };

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      {...props}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-slate-400 mt-1">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';
