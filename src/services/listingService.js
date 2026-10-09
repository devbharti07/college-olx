/**
 * ============================================================================
 * Listing Service (Real Backend API Layer)
 * ============================================================================
 * Connects directly to backend /api/listings endpoints.
 * Handles:
 * - Public active listings browse (GET /api/listings)
 * - Single listing details (GET /api/listings/:id)
 * - Authenticated student listings (GET /api/listings/mine)
 * - Create listing (POST /api/listings)
 * - Upload listing images (POST /api/listings/:id/images via multipart)
 * - Update listing fields (PATCH /api/listings/:id)
 * - Update listing status (PATCH /api/listings/:id/status)
 * - Soft-delete listing (DELETE /api/listings/:id)
 * - Delete listing image (DELETE /api/listings/:id/images)
 * ============================================================================
 */

import apiClient from './apiClient.js';
import { CATEGORIES } from '../data/categories.js';

/**
 * Backend allowed categories:
 * ['books', 'electronics', 'lab-equipment', 'cycles', 'notes', 'clothing', 'hostel-items', 'other']
 */
export function normalizeCategoryForBackend(categoryInput) {
  if (!categoryInput) return 'other';
  const c = String(categoryInput).trim().toLowerCase().replace(/\s+/g, '-');

  const mapping = {
    'books': 'books',
    'book': 'books',
    'textbook': 'books',
    'textbooks': 'books',
    'electronics': 'electronics',
    'electronic': 'electronics',
    'gadget': 'electronics',
    'lab-equipment': 'lab-equipment',
    'lab-apparatus': 'lab-equipment',
    'lab-coat': 'clothing',
    'clothing': 'clothing',
    'engineering-drafter': 'lab-equipment',
    'drafter': 'lab-equipment',
    'bicycles': 'cycles',
    'bicycle': 'cycles',
    'cycles': 'cycles',
    'cycle': 'cycles',
    'bike': 'cycles',
    'notes': 'notes',
    'handwritten-notes': 'notes',
    'hostel-items': 'hostel-items',
    'hostel': 'hostel-items',
    'dorm': 'hostel-items',
  };

  return mapping[c] || 'other';
}

/**
 * Backend allowed conditions:
 * ['new', 'like-new', 'good', 'fair', 'poor']
 */
export function normalizeConditionForBackend(conditionInput) {
  if (!conditionInput) return 'good';
  const cond = String(conditionInput).trim().toLowerCase().replace(/\s+/g, '-');

  const mapping = {
    'new': 'new',
    'brand-new': 'new',
    'like-new': 'like-new',
    'good': 'good',
    'fair': 'fair',
    'poor': 'poor',
  };

  return mapping[cond] || 'good';
}

/**
 * Normalizes backend listing representation for reliable UI consumption.
 */
export function normalizeListing(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw._id || raw.id;
  const rawCategory = raw.category || 'other';
  const categoryObj = CATEGORIES.find(
    (c) => c.id === rawCategory || c.id === rawCategory.replace(/s$/, '')
  );
  const categoryName = categoryObj?.name || raw.categoryName || rawCategory;

  // Format relative or absolute timestamp
  let postedAt = 'Recently';
  if (raw.createdAt) {
    const diffMs = Date.now() - new Date(raw.createdAt).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) {
      postedAt = 'Just now';
    } else if (diffHours < 24) {
      postedAt = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      postedAt = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      postedAt = new Date(raw.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
    }
  }

  // Normalize condition display name (e.g. 'like-new' -> 'Like New')
  const conditionDisplayMap = {
    'new': 'New',
    'like-new': 'Like New',
    'good': 'Good',
    'fair': 'Fair',
    'poor': 'Poor',
  };
  const conditionDisplay =
    conditionDisplayMap[raw.condition?.toLowerCase()] ||
    raw.condition ||
    'Good';

  // Normalize image list
  const images = Array.isArray(raw.images) ? raw.images : [];

  return {
    ...raw,
    id,
    _id: id,
    title: raw.title || 'Untitled Listing',
    description: raw.description || '',
    price: typeof raw.price === 'number' ? raw.price : parseFloat(raw.price) || 0,
    category: rawCategory,
    categoryName,
    condition: conditionDisplay,
    location: raw.location || 'Campus Meetup',
    postedAt,
    status: raw.status || 'active',
    images,
    seller: raw.seller || {
      name: 'Campus Student',
      department: 'Student Member',
      verified: true,
    },
    viewsCount: raw.viewsCount || 0,
  };
}

/**
 * Known development test fixture IDs seeded during database initialization.
 * Using explicit identifiers prevents accidentally filtering legitimate listings
 * that happen to share common textbook titles, meetup spots, or student names.
 */
export const KNOWN_DEV_FIXTURE_IDS = new Set([
  '525d301c-0d3a-4710-888e-f7bd36cbb80a',
]);

export const KNOWN_DEV_FIXTURE_SELLER_IDS = new Set([
  'e7da8f1b-d059-4e3a-b863-6304a4729025',
]);

/**
 * Detects known development fixtures.
 * Identifies records by reliable, explicit fixture identifiers or explicit dev flags.
 * Avoids broad title/seller matching that could hide legitimate student listings.
 */
export function isFillerOrMockListing(item) {
  if (!item || typeof item !== 'object') return false;

  const id = String(item.id || item._id || '').trim();
  const sellerId = String(item.seller?.id || item.seller?._id || '').trim();

  // 1. Explicit fixture ID or seller ID from local development seed
  if (KNOWN_DEV_FIXTURE_IDS.has(id)) return true;
  if (KNOWN_DEV_FIXTURE_SELLER_IDS.has(sellerId)) return true;

  // 2. Explicit fixture/mock flag if present in API record metadata
  if (item.isMock === true || item.isFixture === true || item.isDevFixture === true) return true;

  // 3. Fallback for obvious non-human lorem ipsum filler in description
  const desc = String(item.description || '').toLowerCase().trim();
  if (desc.startsWith('lorem ipsum dolor sit amet')) return true;

  return false;
}

export const listingService = {
  /**
   * Fetch active marketplace listings with backend search, filters, sorting, and pagination.
   * GET /api/listings
   * @param {Object} query - { page, limit, category, search, q, condition, minPrice, maxPrice, location, sort }
   */
  getListings: async (query = {}) => {
    const params = {
      page: query.page || 1,
      limit: query.limit || 20,
    };

    const searchQuery = query.q || query.search;
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      params.q = searchQuery.trim();
    }

    if (query.category && query.category !== 'all') {
      params.category = normalizeCategoryForBackend(query.category);
    }

    if (query.condition && query.condition !== 'all') {
      params.condition = normalizeConditionForBackend(query.condition);
    }

    if (query.minPrice !== undefined && query.minPrice !== '') {
      const min = parseFloat(query.minPrice);
      if (!isNaN(min) && min >= 0) {
        params.minPrice = min;
      }
    }

    if (query.maxPrice !== undefined && query.maxPrice !== '') {
      const max = parseFloat(query.maxPrice);
      if (!isNaN(max) && max >= 0) {
        params.maxPrice = max;
      }
    }

    if (query.location && typeof query.location === 'string' && query.location.trim()) {
      params.location = query.location.trim();
    }

    if (query.sort && ['newest', 'oldest', 'price-low', 'price-high'].includes(query.sort)) {
      params.sort = query.sort;
    }

    const data = await apiClient.get('/listings', { params });
    const rawListings = data?.listings || (Array.isArray(data) ? data : []);
    const normalized = rawListings
      .map(normalizeListing)
      .filter(Boolean)
      .filter((item) => !isFillerOrMockListing(item));

    const totalFiltered = data?.pagination?.total !== undefined
      ? Math.max(0, data.pagination.total - (rawListings.length - normalized.length))
      : normalized.length;

    return {
      listings: normalized,
      pagination: data?.pagination ? {
        ...data.pagination,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / params.limit) || (totalFiltered === 0 ? 0 : 1),
      } : {
        page: params.page,
        limit: params.limit,
        total: normalized.length,
        totalPages: Math.ceil(normalized.length / params.limit) || (normalized.length === 0 ? 0 : 1),
        hasNext: false,
        hasPrev: false,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  /**
   * Fetch single listing by ID.
   * GET /api/listings/:id
   */
  getListingById: async (id) => {
    if (!id) return null;
    const data = await apiClient.get(`/listings/${id}`);
    const raw = data?.listing || data;
    const normalized = normalizeListing(raw);
    if (!normalized || isFillerOrMockListing(normalized)) {
      return null;
    }
    return normalized;
  },

  /**
   * Fetch listings belonging to current authenticated student.
   * GET /api/listings/mine
   */
  getMyListings: async (query = {}) => {
    const params = {
      page: query.page || 1,
      limit: query.limit || 50,
    };
    const data = await apiClient.get('/listings/mine', { params });
    const rawListings = data?.listings || (Array.isArray(data) ? data : []);
    const normalized = rawListings
      .map(normalizeListing)
      .filter(Boolean)
      .filter((item) => !isFillerOrMockListing(item));

    return {
      listings: normalized,
      pagination: data?.pagination || {
        page: params.page,
        limit: params.limit,
        total: normalized.length,
        totalPages: 1,
      },
    };
  },

  /**
   * Create a new marketplace listing.
   * POST /api/listings
   */
  createListing: async (listingData) => {
    const payload = {
      title: listingData.title?.trim(),
      description: listingData.description?.trim(),
      price:
        typeof listingData.price === 'number'
          ? listingData.price
          : parseFloat(listingData.price) || 0,
      category: normalizeCategoryForBackend(listingData.category),
      condition: normalizeConditionForBackend(listingData.condition),
      location: listingData.location?.trim() || 'Campus Meetup',
    };

    const data = await apiClient.post('/listings', payload);
    const raw = data?.listing || data;
    return normalizeListing(raw);
  },

  /**
   * Upload images to an existing listing.
   * POST /api/listings/:id/images
   * @param {string} listingId
   * @param {File[]|Blob[]} files
   */
  uploadListingImages: async (listingId, files) => {
    if (!listingId || !files || !files.length) {
      throw new Error('Listing ID and at least one image file are required.');
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });

    const data = await apiClient.upload(`/listings/${listingId}/images`, formData);
    const raw = data?.listing || data;
    return normalizeListing(raw);
  },

  /**
   * Update allowed fields of an owned listing.
   * PATCH /api/listings/:id
   */
  updateListing: async (id, updates) => {
    const payload = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.price !== undefined) {
      payload.price =
        typeof updates.price === 'number'
          ? updates.price
          : parseFloat(updates.price) || 0;
    }
    if (updates.category !== undefined) {
      payload.category = normalizeCategoryForBackend(updates.category);
    }
    if (updates.condition !== undefined) {
      payload.condition = normalizeConditionForBackend(updates.condition);
    }
    if (updates.location !== undefined) payload.location = updates.location.trim();

    const data = await apiClient.patch(`/listings/${id}`, payload);
    const raw = data?.listing || data;
    return normalizeListing(raw);
  },

  /**
   * Update listing status ('active' <-> 'sold').
   * PATCH /api/listings/:id/status
   */
  updateListingStatus: async (id, status) => {
    const data = await apiClient.patch(`/listings/${id}/status`, { status });
    const raw = data?.listing || data;
    return normalizeListing(raw);
  },

  /**
   * Soft-delete an owned listing.
   * DELETE /api/listings/:id
   */
  deleteListing: async (id) => {
    return apiClient.delete(`/listings/${id}`);
  },

  /**
   * Delete single image from an owned listing.
   * DELETE /api/listings/:id/images
   */
  deleteListingImage: async (id, publicId) => {
    const data = await apiClient.delete(`/listings/${id}/images`, { publicId });
    const raw = data?.listing || data;
    return normalizeListing(raw);
  },

  /**
   * Get related listings from the same category.
   */
  getRelatedListings: async (category, currentId, limit = 3) => {
    try {
      const res = await listingService.getListings({ category, limit: 10 });
      return (res.listings || [])
        .filter((item) => item.id !== currentId && item.status !== 'sold')
        .slice(0, limit);
    } catch {
      return [];
    }
  },

  getCategories: () => CATEGORIES,
};

export default listingService;
