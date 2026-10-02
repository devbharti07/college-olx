import React from 'react';
import { Search, X } from 'lucide-react';
import Button from './Button';

/**
 * Reusable SearchBar component following minimal, student-friendly design tokens.
 */
export default function SearchBar({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search textbooks, lab coats, drafters, calculators...',
  disabled = false,
  showButton = true,
  buttonText = 'Search',
  size = 'md',
  className = '',
  autoFocus = false,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  const sizeClasses = {
    sm: 'py-2 pl-9 pr-8 text-xs',
    md: 'py-2.5 pl-10 pr-9 text-sm',
    lg: 'py-3 pl-11 pr-10 text-sm sm:text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-3',
    md: 'w-4 h-4 left-3.5',
    lg: 'w-4.5 h-4.5 left-4',
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`relative flex items-center gap-2 w-full ${className}`.trim()}
    >
      <div className="relative flex-1">
        <label htmlFor="marketplace-search-input" className="sr-only">
          {placeholder}
        </label>

        <div className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${iconSizes[size] || iconSizes.md}`}>
          <Search className="w-full h-full" aria-hidden="true" />
        </div>

        <input
          id="marketplace-search-input"
          type="search"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs transition-all duration-150 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${sizeClasses[size] || sizeClasses.md}`}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showButton && (
        <Button
          type="submit"
          variant="primary"
          size={size}
          disabled={disabled}
          className="shrink-0"
        >
          {buttonText}
        </Button>
      )}
    </form>
  );
}
