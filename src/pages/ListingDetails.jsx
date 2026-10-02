import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  MessageSquare, 
  Heart, 
  AlertTriangle, 
  Send, 
  Tag, 
  Shield, 
  Home 
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useListings } from '../context';
import { formatPrice } from '../utils/formatters';
import { 
  Badge, 
  Button, 
  Modal, 
  EmptyState,
  ListingCard
} from '../components';

export default function ListingDetails() {
  const { id } = useParams();
  const { getListingById, listings } = useListings();

  const listing = getListingById(id);

  // Interactive UI states
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [prevId, setPrevId] = useState(id);
  if (prevId !== id) {
    setPrevId(id);
    setActiveImageIndex(0);
    setImageError(false);
  }

  const [isSaved, setIsSaved] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState('Inappropriate or prohibited item');

  useDocumentTitle(listing ? listing.title : 'Listing Not Found');

  const handleOpenContactModal = () => {
    setMessageText(`Hi ${listing?.seller?.name || 'Seller'}! Is this item still available for campus meetup?`);
    setIsContactModalOpen(true);
  };

  // Related listings in the same category
  const relatedListings = listing
    ? listings.filter((l) => l.category === listing.category && l.id !== listing.id && l.status !== 'sold').slice(0, 3)
    : [];

  // Proper Not-Found state for invalid listing IDs
  if (!listing) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <EmptyState
          icon={Tag}
          title="Listing Not Found"
          description={`No campus item exists with the identifier "${id}". The item may have been purchased by another student, removed, or the link may be mistyped.`}
          actionLabel="Back to All Listings"
          actionTo="/listings"
          actionIcon={ArrowLeft}
          secondaryActionLabel="Go to Home"
          secondaryActionTo="/"
          secondaryActionIcon={Home}
        />
      </div>
    );
  }

  // Condition styling variant
  const conditionVariant = {
    'New': 'success',
    'Brand New': 'success',
    'Like New': 'primary',
    'Good': 'default',
    'Fair': 'warning',
  }[listing.condition] || 'default';

  const handleSendMessage = (e) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setIsContactModalOpen(false);
    }, 1500);
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setIsReportModalOpen(false);
  };

  const images = listing.images && listing.images.length > 0 ? listing.images : [];
  const currentImage = images[activeImageIndex] || images[0];

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <Link
          to="/listings"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors w-fit focus:outline-none focus-visible:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </Link>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSaved(!isSaved)}
            leftIcon={Heart}
            className={isSaved ? 'text-rose-600 border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100' : ''}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={AlertTriangle}
            className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Report Listing
          </Button>
        </div>
      </div>

      {/* Main Listing Showcase: 2-Column Responsive Marketplace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Image Gallery & Campus Meetup Safety Tips */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Photo Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {currentImage && !imageError ? (
                <img
                  src={currentImage}
                  alt={`${listing.title} - View ${activeImageIndex + 1}`}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover transition-all duration-200"
                />
              ) : (
                <div className="text-center p-8 text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center">
                  <Tag className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <span className="text-xs font-medium">No Image Available</span>
                </div>
              )}

              {/* Condition Badge Overlay */}
              <div className="absolute top-3 left-3">
                <Badge variant={conditionVariant} size="md" pill={false} className="shadow-2xs">
                  {listing.condition}
                </Badge>
              </div>

              {/* Photo count indicator */}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/70 text-white text-[11px] font-medium backdrop-blur-xs">
                  Photo {activeImageIndex + 1} of {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery Strip */}
            {images.length > 1 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setImageError(false);
                    }}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-600/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Safe Campus Handover Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
              <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Campus Handover Safety</span>
            </div>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Arrange to inspect the item and exchange payment in public, well-lit campus areas such as the library lobby, student cafe, or department common rooms.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Details, Price, Seller Profile & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-2xs space-y-5">
            {/* Category & Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Link
                  to={`/listings?category=${listing.category}`}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 uppercase tracking-wide inline-flex items-center gap-1"
                >
                  <span>{listing.categoryName || listing.category}</span>
                </Link>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  <span>{listing.postedAt}</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                {listing.title}
              </h1>
            </div>

            {/* Price & Pickup availability */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Student Price</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    {formatPrice(listing.price)}
                  </span>
                </div>
                <Badge variant={listing.status === 'sold' ? 'default' : 'success'} size="sm">
                  {listing.status === 'sold' ? 'Sold' : 'Available for Pickup'}
                </Badge>
              </div>

              {/* Campus Pickup Location */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Campus Pickup:</span>
                <span>{listing.location || 'Campus Meetup'}</span>
              </div>
            </div>

            {/* Seller Info Container */}
            {listing.seller && (
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Posted by
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                      {listing.seller.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {listing.seller.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {listing.seller.department}
                      </div>
                    </div>
                  </div>
                  {listing.seller.verified && (
                    <Badge variant="primary" size="sm" icon={ShieldCheck}>
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Description Text */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Item Description
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Contact Seller CTA */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={MessageSquare}
                onClick={handleOpenContactModal}
              >
                Contact Seller
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RELATED LISTINGS IN CATEGORY */}
      {relatedListings.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Related Items in {listing.categoryName || listing.category}
            </h2>
            <Link
              to={`/listings?category=${listing.category}`}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              View More
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedListings.map((rel) => (
              <ListingCard key={rel.id} listing={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Contact Seller Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={`Message ${listing.seller?.name || 'Seller'}`}
        description={`Inquire about "${listing.title}"`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsContactModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendMessage}
              leftIcon={Send}
              disabled={!messageText.trim()}
            >
              Send Message
            </Button>
          </div>
        }
      >
        {messageSent ? (
          <div className="py-6 text-center space-y-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-10 h-10 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Message Prepared
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Message submitted locally in this browser session.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-3.5">
            <div className="space-y-1.5">
              <label htmlFor="modal-message-text" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your message to the seller:
              </label>
              <textarea
                id="modal-message-text"
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Ask about condition, availability, or meeting time..."
                className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 p-3 shadow-2xs focus:outline-none focus:border-emerald-600"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Student conversations occur over on-campus messaging. Keep communication within campus policies.
            </p>
          </form>
        )}
      </Modal>

      {/* Report Listing Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Campus Listing"
        description="Help keep the college community marketplace safe and compliant."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReportSubmit}
              leftIcon={AlertTriangle}
            >
              Submit Report
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Please select the reason for reporting this listing:
          </p>

          <div className="space-y-2">
            {[
              'Inappropriate or prohibited item',
              'Suspected commercial seller (non-student)',
              'Misrepresented item condition or pricing',
              'Spam or duplicate posting',
              'Other campus policy violation',
            ].map((reason, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedReportReason === reason
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100 font-medium'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  checked={selectedReportReason === reason}
                  onChange={() => setSelectedReportReason(reason)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            Reports are handled in accordance with campus classified guidelines.
          </p>
        </div>
      </Modal>
    </div>
  );
}
