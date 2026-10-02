import React from 'react';

/**
 * Reusable layout PageHeader component to establish consistent page titles,
 * descriptions, badges, and action buttons across all views.
 */
export default function PageHeader({
  title,
  description,
  badge,
  actions,
  children,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 ${className}`.trim()}
    >
      <div className="space-y-1">
        {badge && <div className="mb-1">{badge}</div>}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}

      {children}
    </div>
  );
}
