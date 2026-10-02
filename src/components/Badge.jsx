import React from 'react';

/**
 * Reusable Badge component for item conditions, verification tags, and categories.
 * Subtle, high-contrast, clean typography.
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  icon: Icon,
  pill = true,
  className = '',
  ...props
}) {
  const baseStyles = `inline-flex items-center font-medium transition-colors select-none ${pill ? 'rounded-full' : 'rounded-md'}`;

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    primary: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
    success: 'bg-teal-50 text-teal-800 border border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/80',
    warning: 'bg-amber-50 text-amber-900 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
    danger: 'bg-rose-50 text-rose-900 border border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80',
    info: 'bg-sky-50 text-sky-800 border border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/80',
    secondary: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
    outline: 'border border-slate-300 text-slate-600 bg-white dark:border-slate-700 dark:text-slate-300 dark:bg-slate-900',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-emerald-600',
    success: 'bg-teal-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600',
    info: 'bg-sky-600',
    secondary: 'bg-white',
    outline: 'bg-slate-500',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5 leading-tight',
    md: 'text-xs px-3 py-1 gap-1.5 leading-tight',
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.sm} ${className}`.trim()}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`}
          aria-hidden="true"
        />
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}
