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

  const baseFieldStyles = 'w-full rounded-xl bg-white dark:bg-slate-800 border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs transition-colors duration-150 focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:cursor-not-allowed';

  const stateStyles = error
    ? 'border-rose-300 dark:border-rose-500/60 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 text-rose-900 dark:text-rose-200'
    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600';

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
        <p id={errorId} className="text-xs text-rose-600 font-medium flex items-center gap-1">
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
