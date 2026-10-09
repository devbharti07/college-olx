import React, { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable accessible Form Input component.
 * Minimalist, crisp 1px borders, subtle focus rings.
 * Supports left icon, right icon, and interactive rightElement (e.g. show/hide toggle).
 */
const Input = forwardRef(function Input(
  {
    label,
    id: customId,
    name,
    type = 'text',
    error,
    helperText,
    required = false,
    disabled = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    rightElement,
    className = '',
    rows = 4,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = customId || (name ? `input-${name}` : generatedId);
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const isTextarea = type === 'textarea';

  const baseFieldStyles = 'w-full rounded-xl bg-white dark:bg-[#18181B] border text-sm text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] shadow-2xs transition-colors duration-150 focus:outline-none disabled:bg-[#FAFAFA] dark:disabled:bg-[#18181B] disabled:text-[#A1A1AA] disabled:border-[#E4E4E7] dark:disabled:border-[#27272A] disabled:cursor-not-allowed';

  const stateStyles = error
    ? 'border-[#DC2626] dark:border-[#F87171] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] text-[#DC2626] dark:text-[#F87171]'
    : 'border-[#E4E4E7] dark:border-[#27272A] hover:border-[#D4D4D8] dark:hover:border-[#3F3F46] focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8]';

  const paddingStyles = isTextarea
    ? 'p-3'
    : `${LeftIcon ? 'pl-9.5' : 'pl-3.5'} ${rightElement || RightIcon || error ? 'pr-10' : 'pr-3.5'} py-2.5`;

  const fieldClasses = `${baseFieldStyles} ${stateStyles} ${paddingStyles} ${className}`.trim();

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-tight"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {!isTextarea && LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <LeftIcon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        {isTextarea ? (
          <textarea
            ref={ref}
            id={inputId}
            name={name}
            rows={rows}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={fieldClasses}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={fieldClasses}
            {...props}
          />
        )}

        {!isTextarea && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
            {error && !rightElement && (
              <AlertCircle className="w-4 h-4 text-rose-500 pointer-events-none" aria-hidden="true" />
            )}
            {rightElement ? (
              rightElement
            ) : RightIcon ? (
              <RightIcon className="w-4 h-4 pointer-events-none" aria-hidden="true" />
            ) : null}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-[#DC2626] dark:text-[#F87171] font-medium flex items-center gap-1">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
