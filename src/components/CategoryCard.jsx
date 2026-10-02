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
          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-600 shadow-xs ring-1 ring-emerald-600'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
      } ${className}`.trim()}
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150 ${
              isActive
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/60 group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
            }`}
          >
            <IconComponent className="w-5 h-5" aria-hidden="true" />
          </div>

          {typeof itemCount === 'number' && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        <h3
          className={`font-semibold text-sm sm:text-base tracking-tight mb-1 transition-colors duration-150 ${
            isActive ? 'text-emerald-950 dark:text-emerald-300 font-bold' : 'text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
          }`}
        >
          {name}
        </h3>

        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
        <span className={isActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}>
          {isActive ? 'Active Filter' : 'Browse'}
        </span>
        <ChevronRight
          className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
            isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
          }`}
          aria-hidden="true"
        />
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-xl">
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-xl"
      >
        {cardContent}
      </button>
    );
  }

  return cardContent;
}
