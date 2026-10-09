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

  const listingId = id || listing._id;
  const rawPrimary = images && images.length > 0 ? images[0] : null;
  const primaryImage =
    typeof rawPrimary === 'object' && rawPrimary !== null ? rawPrimary.url : rawPrimary;

  const conditionVariant = {
    'New': 'success',
    'Brand New': 'success',
    'Like New': 'primary',
    'Good': 'default',
    'Fair': 'warning',
  }[condition] || 'default';

  return (
    <article
      className={`group relative bg-white dark:bg-[#18181B] rounded-xl border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs hover:border-[#6366F1]/50 dark:hover:border-[#818CF8]/50 hover:shadow-md hover:-translate-y-1 transition-all duration-200 ease-out flex flex-col overflow-hidden ${className}`.trim()}
    >
      {/* Image Container with clickable link */}
      <Link
        to={`/listings/${listingId}`}
        className="relative aspect-4/3 w-full bg-[#F4F4F5] dark:bg-[#27272A] overflow-hidden block focus:outline-none"
      >
        {primaryImage && !imageError ? (
          <img
            src={primaryImage}
            alt={title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#71717A] dark:text-[#A1A1AA] bg-[#FAFAFA] dark:bg-[#18181B]">
            <Tag className="w-6 h-6 mb-1 text-[#71717A]/60 dark:text-[#A1A1AA]/60" />
            <span className="text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA]">No Image</span>
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
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-xs transition-colors shadow-2xs z-10 ${
            isSaved
              ? 'text-[#DC2626] dark:text-[#F87171] hover:bg-white dark:hover:bg-[#27272A]'
              : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#DC2626] dark:hover:text-[#F87171] hover:bg-white dark:hover:bg-[#27272A]'
          }`}
          aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#DC2626] text-[#DC2626] dark:fill-[#F87171] dark:text-[#F87171]' : ''}`} />
        </button>
      )}

      {/* Content Container */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {categoryName && (
            <div className="text-[11px] font-semibold text-[#6366F1] dark:text-[#818CF8] tracking-wide uppercase">
              {categoryName}
            </div>
          )}

          <h3 className="font-semibold text-[#18181B] dark:text-[#FAFAFA] text-sm line-clamp-2 group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8] transition-colors leading-snug">
            <Link
              to={`/listings/${listingId}`}
              className="focus:outline-none focus-visible:underline"
            >
              {title}
            </Link>
          </h3>

          <div className="pt-0.5 text-base sm:text-lg font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
            {formatPrice(price)}
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="pt-2.5 border-t border-[#E4E4E7] dark:border-[#27272A] space-y-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">
          <div className="flex items-center justify-between gap-2">
            {location && (
              <span className="flex items-center gap-1 truncate text-[11px]" title={location}>
                <MapPin className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA] shrink-0" />
                <span className="truncate">{location}</span>
              </span>
            )}

            {postedAt && (
              <span className="flex items-center gap-1 shrink-0 text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                <Clock className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>{postedAt}</span>
              </span>
            )}
          </div>

          {seller && (
            <div className="flex items-center justify-between pt-1 border-t border-[#E4E4E7]/60 dark:border-[#27272A]/60 text-[11px]">
              <span className="text-[#71717A] dark:text-[#A1A1AA] truncate">
                {seller.name}
              </span>
              {seller.verified && (
                <span
                  className="inline-flex items-center gap-1 font-medium text-[#16A34A] dark:text-[#22C55E]"
                  title="Verified Student Account"
                >
                  <ShieldCheck className="w-3 h-3 text-[#16A34A] dark:text-[#22C55E]" />
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
