import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FlaskConical,
  ShieldCheck,
  Compass,
  Bike,
  Laptop,
  FileText,
  Home,
  MoreHorizontal,
  ChevronRight,
  Layers
} from 'lucide-react';

const ICON_MAP = {
  BookOpen,
  FlaskConical,
  ShieldCheck,
  Compass,
  Bike,
  Laptop,
  FileText,
  Home,
  MoreHorizontal,
};

/**
 * Reusable CategoryCard component for browsing campus items.
 * Clean, modern, restrained radius, subtle shadow and hover lift.
 */
export default function CategoryCard({
  _id,
  name,
  description,
  icon,
  itemCount,
  isActive = false,
  to,
  onClick,
  className = '',
}) {
  const IconComponent = typeof icon === 'string' ? ICON_MAP[icon] || Layers : icon || Layers;

  const cardContent = (
    <div
      className={`group relative p-4 sm:p-5 rounded-xl border transition-all duration-150 flex flex-col justify-between h-full select-none ${
        isActive
          ? 'bg-[#EEF2FF] dark:bg-[#312E81]/30 border-[#6366F1] dark:border-[#818CF8] shadow-xs ring-1 ring-[#6366F1] dark:ring-[#818CF8]'
          : 'bg-white dark:bg-[#18181B] border-[#E4E4E7] dark:border-[#27272A] shadow-2xs hover:border-[#6366F1]/50 dark:hover:border-[#818CF8]/50 hover:shadow-xs hover:-translate-y-0.5'
      } ${className}`.trim()}
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150 ${
              isActive
                ? 'bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] shadow-xs'
                : 'bg-[#F4F4F5] dark:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] group-hover:bg-[#EEF2FF] dark:group-hover:bg-[#312E81]/40 group-hover:text-[#4F46E5] dark:group-hover:text-[#A5B4FC]'
            }`}
          >
            <IconComponent className="w-5 h-5" aria-hidden="true" />
          </div>

          {typeof itemCount === 'number' && (
            <span className="text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA] bg-[#F4F4F5] dark:bg-[#27272A] px-2 py-0.5 rounded-md">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        <h3
          className={`font-semibold text-sm sm:text-base tracking-tight mb-1 transition-colors duration-150 ${
            isActive ? 'text-[#4F46E5] dark:text-[#A5B4FC] font-bold' : 'text-[#18181B] dark:text-[#FAFAFA] group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8]'
          }`}
        >
          {name}
        </h3>

        {description && (
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between text-xs font-medium">
        <span className={isActive ? 'text-[#4F46E5] dark:text-[#A5B4FC]' : 'text-[#71717A] dark:text-[#A1A1AA] group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8]'}>
          {isActive ? 'Active Filter' : 'Browse'}
        </span>
        <ChevronRight
          className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
            isActive ? 'text-[#6366F1] dark:text-[#818CF8]' : 'text-[#71717A] dark:text-[#A1A1AA] group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8]'
          }`}
          aria-hidden="true"
        />
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] rounded-xl">
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] rounded-xl"
      >
        {cardContent}
      </button>
    );
  }

  return cardContent;
}
