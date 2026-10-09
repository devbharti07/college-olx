import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  IndianRupee, 
  ShieldCheck, 
  ArrowRight,
  Tag,
  AlertCircle,
  LogIn,
  MapPin
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../utils/formatters';
import { useListings } from '../context';
import { useAuth } from '../hooks/useAuth';
import { 
  Badge, 
  Button, 
  Input, 
  PageHeader 
} from '../components';

const CATEGORIES_LIST = [
  'Books',
  'Electronics',
  'Lab Equipment',
  'Bicycles',
  'Notes',
  'Lab Coat',
  'Engineering Drafter',
  'Hostel Items',
  'Other',
];

const CONDITIONS_LIST = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor',
];

const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_IMAGES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per backend config

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

export default function SellItem() {
  useDocumentTitle('Post an Item for Sale');
  const navigate = useNavigate();
  const { addListing } = useListings();
  const { isAuthenticated, isVerified } = useAuth();

  // Form field states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Books');
  const [condition, setCondition] = useState('Good');
  const [location, setLocation] = useState('Campus Meetup');
  const [images, setImages] = useState([]); // [{ id, url, name, size, file }]

  // Validation error states
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: '',
    images: '',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [partialUploadError, setPartialUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle multiple image selection
  const handleImageChange = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;

    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: '' }));
    }
    setSubmitError(null);

    const availableSlots = MAX_IMAGES - images.length;
    if (availableSlots <= 0) {
      setErrors((prev) => ({ ...prev, images: `You can upload up to ${MAX_IMAGES} photos total.` }));
      return;
    }

    const selectedFiles = rawFiles.slice(0, availableSlots);

    selectedFiles.forEach((file) => {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        setErrors((prev) => ({
          ...prev,
          images: 'Please select valid image files (JPEG, PNG, WebP, AVIF).',
        }));
        return;
      }

      // Validate 5 MB limit
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrors((prev) => ({
          ...prev,
          images: `Image "${file.name}" exceeds the 5 MB limit.`,
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result;
        if (dataUrl) {
          setImages((prev) => [
            ...prev,
            {
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              url: dataUrl,
              name: file.name,
              size: (file.size / (1024 * 1024)).toFixed(2), // in MB
              file,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected image
  const handleRemoveImage = (idToRemove) => {
    setImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  // Client-side validation
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: '',
      description: '',
      price: '',
      category: '',
      condition: '',
      location: '',
      images: '',
    };

    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Item title is required.';
      isValid = false;
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title should be at least 3 characters long.';
      isValid = false;
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters.';
      isValid = false;
    }

    // Description validation
    if (!description.trim()) {
      newErrors.description = 'Item description is required.';
      isValid = false;
    } else if (description.trim().length < 10) {
      newErrors.description = 'Please provide at least 10 characters describing the item.';
      isValid = false;
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description exceeds ${MAX_DESCRIPTION_LENGTH} characters.`;
      isValid = false;
    }

    // Price validation
    if (price === '') {
      newErrors.price = 'Price is required (enter 0 for free item).';
      isValid = false;
    } else {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) {
        newErrors.price = 'Please enter a valid price of ₹0 or greater.';
        isValid = false;
      }
    }

    // Category validation
    if (!category) {
      newErrors.category = 'Please choose a category.';
      isValid = false;
    }

    // Condition validation
    if (!condition) {
      newErrors.condition = 'Please specify item condition.';
      isValid = false;
    }

    // Location validation
    if (!location.trim()) {
      newErrors.location = 'Meetup location is required.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setPartialUploadError(null);

    if (!isAuthenticated) {
      setSubmitError('You must sign in with your college account to publish listings.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const filesToUpload = images.map((img) => img.file).filter(Boolean);

      const created = await addListing(
        {
          title: title.trim(),
          price: parseFloat(price) || 0,
          category,
          condition,
          description: description.trim(),
          location: location.trim() || 'Campus Meetup',
        },
        filesToUpload
      );

      const summary = {
        id: created.id || created._id,
        title: created.title,
        price: created.price,
        category: created.categoryName || created.category,
        condition: created.condition,
        description: created.description,
        imagesCount: created.images?.length || 0,
        primaryImage: created.images?.[0]?.url || created.images?.[0] || null,
      };

      setSubmissionFeedback(summary);

      // Reset form fields
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('Books');
      setCondition('Good');
      setLocation('Campus Meetup');
      setImages([]);
    } catch (err) {
      console.error('Failed to create listing:', err);
      if (err.listingCreated) {
        setPartialUploadError({
          listing: err.listingCreated,
          message: err?.message || 'Listing was published, but uploading image(s) to Cloudinary failed.',
        });
      } else {
        setSubmitError(err?.message || 'Failed to publish listing. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Post an Item for Sale"
        description="List your books, lab coats, drafters, calculators, or bikes for campus peers."
        badge={
          <Badge variant="primary" size="sm" icon={ShieldCheck}>
            Campus Classified Post
          </Badge>
        }
      />

      {/* Unauthenticated / Unverified Warnings */}
      {!isAuthenticated && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Please sign in with your student account to list items on the campus marketplace.</span>
          </div>
          <Button variant="primary" size="sm" to="/login?redirect=/sell" leftIcon={LogIn}>
            Sign In
          </Button>
        </div>
      )}

      {isAuthenticated && !isVerified && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Your college email is pending verification. Please verify your institutional email address to post active items.
            </span>
          </div>
          <Button variant="outline" size="sm" to="/profile">
            Check Profile
          </Button>
        </div>
      )}

      {/* Submission Feedback Banner */}
      {submissionFeedback && (
        <div className="bg-[#F0FDF4] dark:bg-[#14532D]/30 border border-[#16A34A]/30 rounded-2xl p-6 shadow-2xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#16A34A] dark:bg-[#22C55E] text-white dark:text-[#09090B] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#18181B] dark:text-[#FAFAFA]">
                  Listing Published to Marketplace
                </h2>
                <Badge variant="primary" size="sm">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                Your item has been securely created and is now live across the campus directory.
              </p>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="p-3.5 bg-white dark:bg-[#18181B] rounded-xl border border-[#E4E4E7] dark:border-[#27272A] flex items-center gap-3 text-xs">
            {submissionFeedback.primaryImage ? (
              <img
                src={submissionFeedback.primaryImage}
                alt="Item preview"
                className="w-14 h-14 rounded-lg object-cover border border-[#E4E4E7] dark:border-[#27272A]"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#FAFAFA] dark:bg-[#27272A] flex flex-col items-center justify-center text-[#71717A] dark:text-[#A1A1AA]">
                <Tag className="w-5 h-5 text-[#71717A] dark:text-[#A1A1AA]" />
                <span className="text-[9px] mt-0.5">No Photo</span>
              </div>
            )}
            <div className="flex-1 space-y-0.5 min-w-0">
              <div className="font-bold text-[#18181B] dark:text-[#FAFAFA] truncate">
                {submissionFeedback.title}
              </div>
              <div className="text-[#16A34A] dark:text-[#22C55E] font-semibold">
                {formatPrice(submissionFeedback.price)}
              </div>
              <div className="text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                {submissionFeedback.category} • {submissionFeedback.condition} • {submissionFeedback.imagesCount} {submissionFeedback.imagesCount === 1 ? 'photo' : 'photos'} attached
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="primary"
              size="sm"
              to={`/listings/${submissionFeedback.id}`}
              rightIcon={ArrowRight}
            >
              View Listing Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              to="/my-listings"
            >
              Go to My Listings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSubmissionFeedback(null)}
            >
              Post Another Item
            </Button>
          </div>
        </div>
      )}

      {/* Partial Upload Error Banner */}
      {partialUploadError && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{partialUploadError.message}</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              to={`/listings/${partialUploadError.listing.id || partialUploadError.listing._id}`}
            >
              View Created Listing
            </Button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {submitError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Sell Item Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="space-y-4">
          {/* 1. Title */}
          <Input
            id="sell-item-title"
            label="Item Title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            error={errors.title}
            placeholder="e.g. Omega Engineering Mini Drafter with Bag"
            helperText="Include brand, model, or subject for textbooks."
          />

          {/* 2. Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="sell-category" className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                Category <span className="text-[#DC2626] dark:text-[#F87171]">*</span>
              </label>
              <select
                id="sell-category"
                name="category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
                className="w-full rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] text-sm text-[#18181B] dark:text-[#FAFAFA] p-2.5 shadow-2xs focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8]"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-[#DC2626] dark:text-[#F87171] font-medium">{errors.category}</p>
              )}
            </div>

            {/* Condition Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="sell-condition" className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                Condition <span className="text-[#DC2626] dark:text-[#F87171]">*</span>
              </label>
              <select
                id="sell-condition"
                name="condition"
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  if (errors.condition) setErrors((prev) => ({ ...prev, condition: '' }));
                }}
                className="w-full rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] text-sm text-[#18181B] dark:text-[#FAFAFA] p-2.5 shadow-2xs focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8]"
              >
                {CONDITIONS_LIST.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
              {errors.condition && (
                <p className="text-xs text-[#DC2626] dark:text-[#F87171] font-medium">{errors.condition}</p>
              )}
            </div>
          </div>

          {/* 3. Price & Meetup Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Input
                id="sell-item-price"
                label="Price (INR ₹)"
                name="price"
                type="number"
                min="0"
                step="1"
                required
                leftIcon={IndianRupee}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                }}
                error={errors.price}
                placeholder="350"
                helperText="Enter 0 for free item."
              />
              {price !== '' && !isNaN(parseFloat(price)) && (
                <div className="text-xs font-semibold text-[#6366F1] dark:text-[#818CF8] pl-1">
                  Preview: {formatPrice(parseFloat(price) || 0)}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Input
                id="sell-item-location"
                label="Campus Pickup Location"
                name="location"
                type="text"
                required
                leftIcon={MapPin}
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                }}
                error={errors.location}
                placeholder="e.g. Central Library / Block C"
                helperText="Public campus meetup spot."
              />
            </div>
          </div>

          {/* 4. Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sell-description" className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                Item Description <span className="text-[#DC2626] dark:text-[#F87171]">*</span>
              </label>
              <span
                className={`text-[11px] font-medium ${
                  description.length > MAX_DESCRIPTION_LENGTH
                    ? 'text-[#DC2626] dark:text-[#F87171]'
                    : 'text-[#71717A] dark:text-[#A1A1AA]'
                }`}
              >
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>

            <textarea
              id="sell-description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder="Describe condition, edition (for textbooks), included accessories, and meetup availability..."
              className={`w-full rounded-xl bg-white dark:bg-[#18181B] border text-sm text-[#18181B] dark:text-[#FAFAFA] p-3 shadow-2xs placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8] transition-colors ${
                errors.description ? 'border-[#DC2626] text-[#DC2626] dark:text-[#F87171]' : 'border-[#E4E4E7] dark:border-[#27272A]'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-[#DC2626] dark:text-[#F87171] font-medium">{errors.description}</p>
            )}
          </div>

          {/* 5. Photos Upload Section */}
          <div className="space-y-2 pt-2 border-t border-[#E4E4E7] dark:border-[#27272A]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                Item Photos <span className="text-[#71717A] dark:text-[#A1A1AA] text-[11px] font-normal">(Optional, up to {MAX_IMAGES})</span>
              </label>
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                {images.length}/{MAX_IMAGES} selected
              </span>
            </div>

            {/* Hidden native multiple file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              multiple
              accept="image/png, image/jpeg, image/jpg, image/webp, image/avif"
              className="hidden"
              id="sell-photo-input"
            />

            {/* Selected Images Grid Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden border border-[#E4E4E7] dark:border-[#27272A] aspect-square bg-[#F4F4F5] dark:bg-[#27272A] shadow-2xs"
                  >
                    <img
                      src={img.url}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Primary badge for first photo */}
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#18181B]/80 text-white text-[10px] font-bold">
                        Cover Photo
                      </span>
                    )}

                    {/* Remove photo button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#18181B]/80 text-white hover:bg-[#DC2626] transition-colors focus:outline-none shadow-xs cursor-pointer"
                      aria-label={`Remove photo ${idx + 1}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Trigger Dropzone */}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                  errors.images
                    ? 'border-[#DC2626]/40 bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 text-[#DC2626] dark:text-[#F87171]'
                    : 'border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#27272A]/40 hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]/80 text-[#71717A] dark:text-[#A1A1AA]'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] shadow-2xs">
                    <UploadCloud className="w-5 h-5 text-[#6366F1] dark:text-[#818CF8]" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA] block">
                      Click to choose photos from device
                    </span>
                    <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] block">
                      JPEG, PNG, WEBP, or AVIF (up to 5 MB each, max {MAX_IMAGES})
                    </span>
                  </div>
                </div>
              </button>
            )}

            {errors.images && (
              <p className="text-xs text-[#DC2626] dark:text-[#F87171] font-medium">{errors.images}</p>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => navigate('/listings')}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={!isAuthenticated}
            leftIcon={PlusCircle}
            className="w-full sm:w-auto min-w-[180px]"
          >
            {isSubmitting ? 'Publishing Listing...' : 'Publish Listing'}
          </Button>
        </div>
      </form>
    </div>
  );
}
