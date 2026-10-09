import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Reusable ErrorState component for handling failed data requests
 * or unexpected runtime conditions gracefully.
 */
export default function ErrorState({
  title = 'Unable to load content',
  message = 'A problem occurred while retrieving information from the campus marketplace. Please try again.',
  onRetry,
  retryText = 'Try Again',
  actionText,
  actionTo,
  onActionClick,
  className = '',
}) {
  return (
    <div
      role="alert"
      className={`p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-[#18181B] border border-[#DC2626]/20 dark:border-[#F87171]/20 shadow-2xs flex flex-col items-center justify-center space-y-3.5 max-w-lg mx-auto animate-fade-in ${className}`.trim()}
    >
      <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 text-[#DC2626] dark:text-[#F87171] flex items-center justify-center">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
          {title}
        </h3>
        {message && (
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            {message}
          </p>
        )}
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRetry}
            leftIcon={RefreshCw}
          >
            {retryText}
          </Button>
        )}

        {actionText && (
          <Button
            variant="outline"
            size="sm"
            to={actionTo}
            onClick={onActionClick}
          >
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
}
