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
      className={`p-8 sm:p-12 text-center rounded-xl bg-white dark:bg-[#18181B] border border-dashed border-[#E4E4E7] dark:border-[#27272A] shadow-2xs flex flex-col items-center justify-center space-y-3.5 max-w-lg mx-auto animate-fade-in ${className}`.trim()}
    >
      <div className="w-12 h-12 rounded-xl bg-[#F4F4F5] dark:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
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
