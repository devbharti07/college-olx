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
  Eye,
  Tag
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../utils/formatters';
import { useListings } from '../context';
import { 
  Badge, 
  Button, 
  Input, 
  PageHeader 
} from '../components';

const CATEGORIES_LIST = [
  'Books',
  'Lab Equipment',
  'Lab Coat',
  'Engineering Drafter',
  'Bicycles',
  'Electronics',
  'Notes',
  'Other',
];

const CONDITIONS_LIST = [
  'New',
  'Like New',
  'Good',
  'Fair',
];

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_IMAGES = 5;

export default function SellItem() {
  useDocumentTitle('Post an Item for Sale');
  const navigate = useNavigate();
  const { addListing } = useListings();

  // Form field states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Books');
  const [condition, setCondition] = useState('Good');
  const [images, setImages] = useState([]); // [{ id, url, name, size }]

  // Validation error states
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    images: '',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);
  const fileInputRef = useRef(null);

  // Handle multiple image selection from file input using Data URLs
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: '' }));
    }

    const availableSlots = MAX_IMAGES - images.length;
    if (availableSlots <= 0) {
      setErrors((prev) => ({ ...prev, images: `You can upload up to ${MAX_IMAGES} photos.` }));
      return;
    }

    const selectedFiles = files.slice(0, availableSlots);

    selectedFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, images: 'Please select valid image files (PNG, JPG, WebP).' }));
        return;
      }
      if (file.size > 2.5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, images: 'Image size should be under 2.5MB.' }));
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
              size: (file.size / 1024).toFixed(1), // in KB
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file input value so user can re-select same file if needed
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
      images: '',
    };

    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Item title is required.';
      isValid = false;
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title should be at least 3 characters long.';
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

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Add listing to the shared frontend state and persistence
      const created = addListing({
        title: title.trim(),
        price: parseFloat(price) || 0,
        category,
        condition,
        description: description.trim(),
        images: images.map((img) => img.url),
        location: 'Campus Meetup',
      });

      const summary = {
        id: created.id,
        title: created.title,
        price: created.price,
        category: created.categoryName,
        condition: created.condition,
        description: created.description,
        imagesCount: created.images.length,
        primaryImage: created.images[0] || null,
      };

      setSubmissionFeedback(summary);

      // Reset form fields
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('Books');
      setCondition('Good');
      setImages([]);
    } catch (err) {
      console.error('Failed to create listing:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestAnother = () => {
    setSubmissionFeedback(null);
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

      {/* Honest Form Submission Feedback State */}
      {submissionFeedback && (
        <div className="bg-slate-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-6 shadow-2xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Listing Added to Session
                </h2>
                <Badge variant="primary" size="sm">
                  Active in Marketplace
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Listing added to this session. Your item is now immediately visible across the Listings catalog, Home page, and your My Listings dashboard.
              </p>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs">
            {submissionFeedback.primaryImage ? (
              <img
                src={submissionFeedback.primaryImage}
                alt="Validated item preview"
                className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400">
                <Tag className="w-5 h-5 text-slate-400" />
                <span className="text-[9px] mt-0.5">No Photo</span>
              </div>
            )}
            <div className="flex-1 space-y-0.5 min-w-0">
              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{submissionFeedback.title}</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-semibold">{formatPrice(submissionFeedback.price)}</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                {submissionFeedback.category} • {submissionFeedback.condition} • {submissionFeedback.imagesCount} {submissionFeedback.imagesCount === 1 ? 'photo' : 'photos'} attached
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Button
              variant="primary"
              size="sm"
              to="/listings"
              rightIcon={ArrowRight}
            >
              View in Listings
            </Button>
            <Button
              variant="outline"
              size="sm"
              to={`/listings/${submissionFeedback.id}`}
              leftIcon={Eye}
            >
              View Listing Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestAnother}
            >
              Post Another Item
            </Button>
          </div>
        </div>
      )}

      {/* Main Sell Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 space-y-6 shadow-2xs"
      >
        <div className="space-y-5">
          {/* 1. Item Title */}
          <Input
            id="sell-item-title"
            label="Item Title"
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            error={errors.title}
            placeholder="e.g. Casio fx-991EX Calculator, Engineering Drafter, Organic Chemistry Book"
            helperText="Clear titles help other students find your item faster."
          />

          {/* 2. Category & Condition (2-col grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="sell-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="sell-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
                className={`w-full rounded-xl bg-white dark:bg-slate-800 border text-sm text-slate-900 dark:text-slate-100 px-3.5 py-2.5 shadow-2xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors ${
                  errors.category ? 'border-rose-400 text-rose-900 dark:text-rose-300' : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-rose-600 font-medium">{errors.category}</p>
              )}
            </div>

            {/* Condition dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="sell-condition" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Condition <span className="text-rose-500">*</span>
              </label>
              <select
                id="sell-condition"
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  if (errors.condition) setErrors((prev) => ({ ...prev, condition: '' }));
                }}
                className={`w-full rounded-xl bg-white dark:bg-slate-800 border text-sm text-slate-900 dark:text-slate-100 px-3.5 py-2.5 shadow-2xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors ${
                  errors.condition ? 'border-rose-400 text-rose-900 dark:text-rose-300' : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                {CONDITIONS_LIST.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
              {errors.condition && (
                <p className="text-xs text-rose-600 font-medium">{errors.condition}</p>
              )}
            </div>
          </div>

          {/* 3. Price */}
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
              helperText="Set a fair student price in Indian Rupees (₹). Enter 0 for a free give-away item."
            />
            {price !== '' && !isNaN(parseFloat(price)) && (
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 pl-1">
                Display Preview: {formatPrice(parseFloat(price) || 0)}
              </div>
            )}
          </div>

          {/* 4. Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sell-description" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Item Description <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-medium ${
                  description.length > MAX_DESCRIPTION_LENGTH
                    ? 'text-rose-600'
                    : 'text-slate-400 dark:text-slate-500'
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
              placeholder="Describe condition, edition (for books), whether all parts are included, and preferred on-campus meetup location..."
              className={`w-full rounded-xl bg-white dark:bg-slate-800 border text-sm text-slate-900 dark:text-slate-100 p-3 shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors ${
                errors.description ? 'border-rose-400 text-rose-900 dark:text-rose-300' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-rose-600 font-medium">{errors.description}</p>
            )}
          </div>

          {/* 5. Photos Upload Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Item Photos <span className="text-slate-400 text-[11px] font-normal">(Optional, up to {MAX_IMAGES})</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {images.length}/{MAX_IMAGES} uploaded
              </span>
            </div>

            {/* Hidden native multiple file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              multiple
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              id="sell-photo-input"
            />

            {/* Selected Images Grid Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-800 shadow-2xs"
                  >
                    <img
                      src={img.url}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Primary badge for first photo */}
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                        Cover Photo
                      </span>
                    )}

                    {/* Remove photo button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors focus:outline-none shadow-xs cursor-pointer"
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
                className={`w-full border border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  errors.images
                    ? 'border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 shadow-2xs">
                    <UploadCloud className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                      Click to choose photos from device
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      PNG, JPG, or WEBP (up to {MAX_IMAGES} photos)
                    </span>
                  </div>
                </div>
              </button>
            )}

            {errors.images && (
              <p className="text-xs text-rose-600 font-medium">{errors.images}</p>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
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
            leftIcon={PlusCircle}
            className="w-full sm:w-auto min-w-[180px]"
          >
            {isSubmitting ? 'Adding Listing...' : 'Add Listing'}
          </Button>
        </div>
      </form>
    </div>
  );
}
