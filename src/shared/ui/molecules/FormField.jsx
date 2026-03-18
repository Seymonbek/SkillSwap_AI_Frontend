import React from 'react';
import { Input } from '@/shared/ui/atoms/Input';

/**
 * FormField Molecule - Complete form field with label, input, and validation
 */

export const FormField = React.forwardRef(({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helper,
  required = false,
  leftIcon,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <Input
        ref={ref}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        error={error}
        helper={helper}
        leftIcon={leftIcon}
        fullWidth
        {...props}
      />
    </div>
  );
});

FormField.displayName = 'FormField';
