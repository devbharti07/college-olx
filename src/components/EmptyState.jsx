import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

/**
 * Reusable EmptyState component when queries yield zero results
 * or when item lists are empty.
 */
export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'Try adjusting your search criteria or filter options to find what you need.',
  actionText,
  actionLabel,
  actionTo,
  onActionClick,
  actionIcon,
  secondaryActionText,
  secondaryActionLabel,
  secondaryActionTo,
  secondaryActionIcon,
  onSecondaryActionClick,
  className = '',
}) {
  const primaryText = actionText || actionLabel;
  const secondaryText = secondaryActionText || secondaryActionLabel;
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col items-center justify-center space-y-3.5 max-w-lg mx-auto ${className}`.trim()}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(primaryText || secondaryText) && (
        <div className="pt-1.5 flex flex-wrap items-center justify-center gap-2.5">
          {primaryText && (
            <Button
              variant="primary"
              size="sm"
              to={actionTo}
              onClick={onActionClick}
              leftIcon={actionIcon}
            >
              {primaryText}
            </Button>
          )}

          {secondaryText && (
            <Button
              variant="outline"
              size="sm"
              to={secondaryActionTo}
              onClick={onSecondaryActionClick}
              leftIcon={secondaryActionIcon}
            >
              {secondaryText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
