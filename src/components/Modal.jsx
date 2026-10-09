import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable accessible Modal dialog component following Campus Classifieds design system.
 * Restrained border radius, subtle shadow, clean header and footer separation.
 */
export default function Modal({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
    >
      {/* Dimmed backdrop - subtle opacity, no excessive blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity duration-200 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} bg-white dark:bg-[#18181B] rounded-2xl shadow-xl border border-[#E4E4E7] dark:border-[#27272A] z-10 overflow-hidden transform animate-scale-in ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-[#E4E4E7] dark:border-[#27272A]">
            <div>
              {title && (
                <h2 id="modal-title" className="text-base sm:text-lg font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="px-5 py-4 text-sm text-[#18181B] dark:text-[#FAFAFA]">
          {children}
        </div>

        {/* Footer Actions */}
        {footer && (
          <div className="px-5 py-3 bg-[#FAFAFA] dark:bg-[#18181B] border-t border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
