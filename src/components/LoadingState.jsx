import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable LoadingState component with spinner and skeleton options.
 */
export default function LoadingState({
  message = 'Loading campus listings...',
  description,
  type = 'spinner', // 'spinner' | 'skeleton-grid'
  count = 4,
  className = '',
}) {
  if (type === 'skeleton-grid') {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={message}
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 ${className}`.trim()}
      >
        <span className="sr-only">{message}</span>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 animate-pulse shadow-2xs"
          >
            <div className="aspect-4/3 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-sm" />
              <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-sm" />
              <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-sm" />
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-sm" />
              <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-busy="true"
      className={`flex flex-col items-center justify-center p-10 text-center space-y-2.5 min-h-[200px] ${className}`.trim()}
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
      </div>

      <div className="space-y-0.5">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {message}
        </h4>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
