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
    default: 'bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7] dark:bg-[#27272A] dark:text-[#A1A1AA] dark:border-[#27272A]',
    primary: 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] dark:bg-[#312E81]/30 dark:text-[#A5B4FC] dark:border-[#4338CA]/40',
    success: 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] dark:bg-[#14532D]/30 dark:text-[#22C55E] dark:border-[#16A34A]/40',
    warning: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] dark:bg-[#78350F]/30 dark:text-[#FBBF24] dark:border-[#B45309]/40',
    danger: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] dark:bg-[#7F1D1D]/30 dark:text-[#F87171] dark:border-[#DC2626]/40',
    info: 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] dark:bg-[#312E81]/30 dark:text-[#A5B4FC] dark:border-[#4338CA]/40',
    secondary: 'bg-[#18181B] text-[#FAFAFA] dark:bg-[#FAFAFA] dark:text-[#18181B]',
    outline: 'border border-[#E4E4E7] text-[#71717A] bg-white dark:border-[#27272A] dark:text-[#A1A1AA] dark:bg-[#18181B]',
  };

  const dotColors = {
    default: 'bg-[#71717A]',
    primary: 'bg-[#6366F1] dark:bg-[#818CF8]',
    success: 'bg-[#16A34A] dark:bg-[#22C55E]',
    warning: 'bg-[#B45309] dark:bg-[#FBBF24]',
    danger: 'bg-[#DC2626] dark:bg-[#F87171]',
    info: 'bg-[#6366F1] dark:bg-[#818CF8]',
    secondary: 'bg-white dark:bg-[#18181B]',
    outline: 'bg-[#71717A]',
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
