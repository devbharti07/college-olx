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
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in ${className}`.trim()}
      >
        <span className="sr-only">{message}</span>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#18181B] rounded-xl border border-[#E4E4E7] dark:border-[#27272A] p-4 space-y-3 shadow-2xs overflow-hidden"
          >
            <div className="aspect-4/3 w-full rounded-lg skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-3 w-1/4 rounded-sm skeleton-shimmer" />
              <div className="h-4 w-4/5 rounded-sm skeleton-shimmer" />
              <div className="h-5 w-1/3 rounded-sm skeleton-shimmer" />
            </div>
            <div className="pt-2 border-t border-[#E4E4E7] dark:border-[#27272A] flex justify-between">
              <div className="h-3 w-1/3 rounded-sm skeleton-shimmer" />
              <div className="h-3 w-1/4 rounded-sm skeleton-shimmer" />
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
      className={`flex flex-col items-center justify-center p-10 text-center space-y-2.5 min-h-[200px] animate-fade-in ${className}`.trim()}
    >
      <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] dark:bg-[#312E81]/30 text-[#6366F1] dark:text-[#818CF8] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
      </div>

      <div className="space-y-0.5">
        <h4 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">
          {message}
        </h4>
        {description && (
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-xs">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
