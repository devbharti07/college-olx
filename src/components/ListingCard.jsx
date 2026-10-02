import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ShieldCheck, Tag, Heart } from 'lucide-react';
import Badge from './Badge';
import { formatPrice } from '../utils/formatters';

/**
 * Reusable ListingCard component for marketplace items.
 * Clean typography, crisp border, subtle hover state, restrained radius.
 * Navigates to /listings/:id on click.
 */
export default function ListingCard({
  listing,
  onSave,
  isSaved = false,
  className = '',
}) {
  const [imageError, setImageError] = useState(false);

  if (!listing) return null;

  const {
    id,
    title,
    price,
    categoryName,
    condition,
    location,
    postedAt,
    seller,
    images = [],
  } = listing;

  const primaryImage = images && images.length > 0 ? images[0] : null;

  const conditionVariant = {
    'New': 'success',
    'Brand New': 'success',
    'Like New': 'primary',
    'Good': 'default',
    'Fair': 'warning',
  }[condition] || 'default';

  return (
    <article
      className={`group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 flex flex-col overflow-hidden ${className}`.trim()}
    >
      {/* Image Container with clickable link */}
      <Link
        to={`/listings/${id}`}
        className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden block focus:outline-none"
      >
        {primaryImage && !imageError ? (
          <img
            src={primaryImage}
            alt={title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50">
            <Tag className="w-6 h-6 mb-1 text-slate-300 dark:text-slate-600" />
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">No Image</span>
          </div>
        )}

        {/* Condition Badge Overlay */}
        {condition && (
          <div className="absolute top-2.5 left-2.5 pointer-events-none">
            <Badge variant={conditionVariant} size="sm" pill={false} className="shadow-2xs">
              {condition}
            </Badge>
          </div>
        )}
      </Link>

      {/* Save button */}
      {onSave && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSave(id);
          }}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs transition-colors shadow-2xs z-10 ${
            isSaved
              ? 'text-rose-600 hover:bg-white dark:hover:bg-slate-800'
              : 'text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800'
          }`}
          aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      )}

      {/* Content Container */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {categoryName && (
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">
              {categoryName}
            </div>
          )}

          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug">
            <Link
              to={`/listings/${id}`}
              className="focus:outline-none focus-visible:underline"
            >
              {title}
            </Link>
          </h3>

          <div className="pt-0.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {formatPrice(price)}
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between gap-2">
            {location && (
              <span className="flex items-center gap-1 truncate text-[11px]" title={location}>
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{location}</span>
              </span>
            )}

            {postedAt && (
              <span className="flex items-center gap-1 shrink-0 text-[11px] text-slate-400">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{postedAt}</span>
              </span>
            )}
          </div>

          {seller && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/60 text-[11px]">
              <span className="text-slate-600 dark:text-slate-400 truncate">
                {seller.name}
              </span>
              {seller.verified && (
                <span
                  className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400"
                  title="Verified Student Account"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
