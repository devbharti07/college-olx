import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Reusable accessible Button component following Campus Classifieds design system.
 * Minimal, tactile, accessible, with subtle hover states.
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  to,
  href,
  fullWidth = false,
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.99] select-none';

  const variantStyles = {
    primary: 'bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-xs focus-visible:ring-[#6366F1] dark:bg-[#818CF8] dark:hover:bg-[#A5B4FC] dark:text-[#09090B]',
    secondary: 'bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] text-[#18181B] dark:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] shadow-2xs focus-visible:ring-[#6366F1]',
    outline: 'border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] hover:border-[#D4D4D8] dark:hover:border-[#3F3F46] focus-visible:ring-[#6366F1] shadow-2xs',
    ghost: 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] focus-visible:ring-[#6366F1]',
    danger: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs focus-visible:ring-[#DC2626] dark:bg-[#F87171] dark:hover:bg-[#EF4444] dark:text-[#09090B]',
    success: 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs focus-visible:ring-[#16A34A] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] dark:text-[#09090B]',
    subtle: 'bg-[#EEF2FF] dark:bg-[#312E81]/30 text-[#4338CA] dark:text-[#C7D2FE] hover:bg-[#E0E7FF] dark:hover:bg-[#312E81]/50 border border-[#C7D2FE]/60 dark:border-[#4338CA]/60 focus-visible:ring-[#6366F1]',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const disabledStyles = (disabled || loading)
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : '';

  const widthStyles = fullWidth ? 'w-full' : '';

  const combinedClasses = `${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${disabledStyles} ${widthStyles} ${className}`.trim();

  const content = (
    <>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : null}
      
      <span>{children}</span>

      {!loading && RightIcon && (
        <RightIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={combinedClasses} onClick={onClick} {...props}>
        {content}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} className={combinedClasses} onClick={onClick} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}
