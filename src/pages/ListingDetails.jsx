import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Home,
  Package
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useListings } from '../context';
import { useAuth } from '../hooks/useAuth';
import { listingService } from '../services/listingService';
import { messageService } from '../services/messageService';
import apiClient from '../services/apiClient';
import { formatPrice } from '../utils/formatters';
import { 
  Badge, 
  Button, 
  Modal, 
  EmptyState, 
  LoadingState, 
  ErrorState, 
  ListingCard 
} from '../components';

const getImageUrl = (img) => (typeof img === 'object' && img !== null ? img.url : img);

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getListingById, listings } = useListings();
  const { user, isAuthenticated, keycloakEmailVerified, isVerified } = useAuth();

  const [listing, setListing] = useState(() => getListingById(id));
  const [loading, setLoading] = useState(!listing);
  const [error, setError] = useState(null);

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
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [contactError, setContactError] = useState(null);
  const [selectedReportReason, setSelectedReportReason] = useState('Inappropriate or prohibited item');
  const [reportFeedback, setReportFeedback] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Fetch listing data from backend API
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const cached = getListingById(id);
      if (cached) {
        setListing(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const fetched = await listingService.getListingById(id);
        if (isMounted) {
          setListing(fetched);
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404 || err.code === 'LISTING_NOT_FOUND' || err.code === 'INVALID_IDENTIFIER') {
            setListing(null);
          } else {
            setError(err?.message || 'Unable to retrieve listing details.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, getListingById]);

  useDocumentTitle(listing ? `${listing.title} | Campus Marketplace` : 'Listing Details');

  const handleOpenContactModal = () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/listings/${id}`));
      return;
    }
    if (!user.isVerified) {
      setContactError('Institutional college email verification is required to message sellers.');
    } else {
      setContactError(null);
    }
    setMessageText(`Hi ${listing?.seller?.name || 'Seller'}! Is this item still available for campus meetup?`);
    setIsContactModalOpen(true);
  };

  // Related listings in the same category
  const relatedListings = listing
    ? listings
        .filter((l) => l.category === listing.category && l.id !== listing.id && l.status !== 'sold')
        .slice(0, 3)
    : [];

  // Loading state
  if (loading) {
    return (
      <div className="py-16 max-w-xl mx-auto">
        <LoadingState message="Retrieving listing details from campus marketplace..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <ErrorState
          title="Failed to Load Listing"
          message={error}
          onRetry={async () => {
            setLoading(true);
            setError(null);
            try {
              const res = await listingService.getListingById(id);
              setListing(res);
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }}
          actionText="Back to Listings"
          actionTo="/listings"
        />
      </div>
    );
  }

  // Proper Not-Found state for invalid or removed listing IDs
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

  const isOwner =
    user &&
    (listing.seller?._id === user.id ||
      listing.seller?.id === user.id ||
      listing.seller === user.id);

  // Condition styling variant
  const conditionVariant = {
    'New': 'success',
    'Brand New': 'success',
    'Like New': 'primary',
    'Good': 'default',
    'Fair': 'warning',
  }[listing.condition] || 'default';

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/listings/${id}`));
      return;
    }
    if (!user.isVerified) {
      setContactError('Institutional college email verification is required before sending messages.');
      return;
    }
    if (!messageText.trim()) return;

    setIsSubmittingMessage(true);
    setContactError(null);
    try {
      const res = await messageService.startConversation(listing.id, messageText.trim());
      const convId = res?.conversation?.id;
      setMessageSent(true);
      setTimeout(() => {
        setMessageSent(false);
        setIsContactModalOpen(false);
        if (convId) {
          navigate(`/messages?conversationId=${convId}`);
        } else {
          navigate('/messages');
        }
      }, 500);
    } catch (err) {
      setContactError(err.message || 'Unable to contact seller. Please try again.');
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleOpenReportModal = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setReportFeedback(null);
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (keycloakEmailVerified === false) {
      setReportFeedback({
        type: 'error',
        message: 'Please verify your email before using this feature.',
      });
      return;
    }

    if (!isVerified) {
      setReportFeedback({
        type: 'error',
        message: 'Your email is verified, but your college account still needs verification.',
      });
      return;
    }

    setIsSubmittingReport(true);
    setReportFeedback(null);
    try {
      await apiClient.post('/reports', {
        reason: selectedReportReason,
        description: `Infraction report submitted for listing "${listing?.title}" (${listing?.id})`,
        listingId: listing?.id,
      });
      setReportFeedback({
        type: 'success',
        message: 'Report submitted successfully. Campus moderation will review this listing.',
      });
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportFeedback(null);
      }, 2000);
    } catch (err) {
      setReportFeedback({
        type: 'error',
        message: err?.response?.data?.error?.message || err?.message || 'Failed to submit report.',
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const images = listing.images && listing.images.length > 0 ? listing.images : [];
  const currentImage = images[activeImageIndex] || images[0];
  const currentImageUrl = getImageUrl(currentImage);

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E4E4E7] dark:border-[#27272A]">
        <Link
          to="/listings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#6366F1] dark:hover:text-[#818CF8] transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Listings</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Save Listing Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSaved(!isSaved)}
            leftIcon={Heart}
            className={isSaved ? 'text-[#DC2626] border-[#DC2626]/30' : ''}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Button>

          {/* Report Listing */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenReportModal}
            leftIcon={AlertTriangle}
            className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#DC2626] dark:hover:text-[#F87171] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20"
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
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs overflow-hidden">
            <div className="relative aspect-4/3 w-full bg-[#F4F4F5] dark:bg-[#27272A] flex items-center justify-center overflow-hidden">
              {currentImageUrl && !imageError ? (
                <img
                  src={currentImageUrl}
                  alt={`${listing.title} - View ${activeImageIndex + 1}`}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover transition-all duration-200"
                />
              ) : (
                <div className="text-center p-8 text-[#71717A] dark:text-[#A1A1AA] flex flex-col items-center justify-center">
                  <Tag className="w-12 h-12 mx-auto mb-2 text-[#71717A]/40 dark:text-[#A1A1AA]/40" />
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
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/70 text-white text-[11px] font-medium backdrop-blur-xs">
                  Photo {activeImageIndex + 1} of {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery Strip */}
            {images.length > 1 && (
              <div className="p-3 bg-[#FAFAFA] dark:bg-[#27272A] border-t border-[#E4E4E7] dark:border-[#27272A] flex items-center gap-2.5 overflow-x-auto">
                {images.map((img, idx) => {
                  const thumbUrl = getImageUrl(img);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveImageIndex(idx);
                        setImageError(false);
                      }}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#6366F1] dark:border-[#818CF8] ring-2 ring-[#6366F1]/30 dark:ring-[#818CF8]/30'
                          : 'border-[#E4E4E7] dark:border-[#27272A] hover:border-[#6366F1]/50 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={thumbUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Safe Campus Handover Banner */}
          <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] space-y-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <div className="flex items-center gap-1.5 font-bold text-[#18181B] dark:text-[#FAFAFA]">
              <Shield className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8]" />
              <span>Campus Handover Safety</span>
            </div>
            <p className="leading-relaxed text-[#71717A] dark:text-[#A1A1AA]">
              Arrange to inspect the item and exchange payment in public, well-lit campus areas such as the library lobby, student cafe, or department common rooms.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Details, Price, Seller Profile & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] p-5 sm:p-7 shadow-2xs space-y-5">
            {/* Category & Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Link
                  to={`/listings?category=${listing.category}`}
                  className="text-xs font-semibold text-[#6366F1] dark:text-[#818CF8] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] uppercase tracking-wide inline-flex items-center gap-1"
                >
                  <span>{listing.categoryName || listing.category}</span>
                </Link>
                <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
                  <span>{listing.postedAt}</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight leading-snug">
                {listing.title}
              </h1>
            </div>

            {/* Price & Pickup availability */}
            <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#27272A] space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] block">Student Price</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
                    {formatPrice(listing.price)}
                  </span>
                </div>
                <Badge variant={listing.status === 'sold' ? 'default' : 'success'} size="sm">
                  {listing.status === 'sold' ? 'Sold' : 'Available for Pickup'}
                </Badge>
              </div>

              {/* Campus Pickup Location */}
              <div className="pt-2 border-t border-[#E4E4E7] dark:border-[#27272A] flex items-center gap-2 text-xs text-[#18181B] dark:text-[#FAFAFA]">
                <MapPin className="w-3.5 h-3.5 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
                <span className="font-semibold text-[#18181B] dark:text-[#FAFAFA]">Campus Pickup:</span>
                <span className="text-[#71717A] dark:text-[#A1A1AA]">{listing.location || 'Campus Meetup'}</span>
              </div>
            </div>

            {/* Seller Info Container */}
            {listing.seller && (
              <div className="p-3.5 rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] block">
                  Posted by
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#EEF2FF] dark:bg-[#312E81]/40 text-[#4F46E5] dark:text-[#A5B4FC] flex items-center justify-center font-bold text-xs">
                      {listing.seller.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                        {listing.seller.name}
                      </div>
                      <div className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                        {listing.seller.college || listing.seller.department || 'Student Member'}
                      </div>
                    </div>
                  </div>
                  {(listing.seller.isVerified || listing.seller.verified) && (
                    <Badge variant="primary" size="sm" icon={ShieldCheck}>
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Description Text */}
            <div className="space-y-2 pt-1 border-t border-[#E4E4E7] dark:border-[#27272A]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                Item Description
              </h2>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Contact Seller CTA / Owner Banner */}
            <div className="pt-2">
              {isOwner ? (
                <div className="space-y-2">
                  <div className="p-3 bg-[#EEF2FF] dark:bg-[#312E81]/30 border border-[#6366F1]/30 dark:border-[#818CF8]/30 rounded-xl text-center text-xs text-[#4F46E5] dark:text-[#A5B4FC] font-medium">
                    You posted this listing. You can manage or edit it in My Listings.
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    leftIcon={Package}
                    to="/my-listings"
                  >
                    Manage in My Listings
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  leftIcon={MessageSquare}
                  onClick={handleOpenContactModal}
                >
                  Contact Seller
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RELATED LISTINGS IN CATEGORY */}
      {relatedListings.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[#E4E4E7] dark:border-[#27272A]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
              Related Items in {listing.categoryName || listing.category}
            </h2>
            <Link
              to={`/listings?category=${listing.category}`}
              className="text-xs font-semibold text-[#6366F1] dark:text-[#818CF8] hover:underline"
            >
              View More
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}

      {/* CONTACT SELLER MODAL */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={`Message ${listing.seller?.name || 'Seller'}`}
      >
        <form onSubmit={handleSendMessage} className="space-y-4">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Send an instant campus message to negotiate price or arrange a public meetup location.
          </p>

          <textarea
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full text-xs p-3 rounded-lg border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] resize-none"
            placeholder="Write your message..."
            required
            disabled={isSubmittingMessage || !user?.isVerified}
          />

          {contactError && (
            <div className="p-2.5 bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#DC2626]/30 text-[#DC2626] dark:text-[#F87171] text-xs rounded-lg font-medium">
              {contactError}
            </div>
          )}

          {messageSent && (
            <div className="p-2.5 bg-[#F0FDF4] dark:bg-[#14532D]/30 border border-[#16A34A]/30 text-[#16A34A] dark:text-[#22C55E] text-xs rounded-lg text-center font-medium">
              Message dispatched! The seller will be notified.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsContactModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              leftIcon={Send}
              disabled={messageSent || isSubmittingMessage || !user?.isVerified || !messageText.trim()}
            >
              {isSubmittingMessage ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* REPORT LISTING MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportFeedback(null);
        }}
        title="Report Campus Listing"
      >
        {keycloakEmailVerified === false ? (
          <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 mx-auto text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#18181B] dark:text-[#FAFAFA]">
                Email Verification Required
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Please verify your email before using this feature.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <Button size="sm" variant="primary" to="/verify-email">
                Verify Email
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsReportModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : !isVerified ? (
          <div className="p-5 rounded-xl bg-[#F0FDF4] dark:bg-[#14532D]/30 border border-[#16A34A]/30 text-center space-y-3">
            <ShieldCheck className="w-8 h-8 mx-auto text-[#16A34A] dark:text-[#22C55E]" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#18181B] dark:text-[#FAFAFA]">
                Institutional Verification Required
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Your email is verified, but your college account still needs verification.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <Button size="sm" variant="primary" to="/profile">
                Verify College Email in Profile
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsReportModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Help maintain a safe campus marketplace. Select the infraction reason for administrator review.
            </p>

            {reportFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  reportFeedback.type === 'success'
                    ? 'bg-[#F0FDF4] text-[#16A34A] dark:text-[#22C55E] border-[#16A34A]/30'
                    : 'bg-[#FEF2F2] text-[#DC2626] dark:text-[#F87171] border-[#DC2626]/30'
                }`}
              >
                <span>{reportFeedback.message}</span>
              </div>
            )}

            <div className="space-y-2">
              {[
                'Inappropriate or prohibited item',
                'Suspected counterfeit or scam',
                'Misleading description or condition',
                'Off-campus commercial seller',
                'Other campus policy violation',
              ].map((reason, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg border border-[#E4E4E7] dark:border-[#27272A] hover:bg-[#FAFAFA] dark:hover:bg-[#27272A]/60 cursor-pointer text-xs text-[#18181B] dark:text-[#FAFAFA]"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReportReason === reason}
                    onChange={(e) => setSelectedReportReason(e.target.value)}
                    className="text-[#6366F1] focus:ring-[#6366F1]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setIsReportModalOpen(false);
                  setReportFeedback(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmittingReport}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
