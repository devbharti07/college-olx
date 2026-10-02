/**
 * ============================================================================
 * Listing Service (Frontend API Service Layer)
 * ============================================================================
 * Handles fetching, filtering, sorting, and retrieving listings.
 * Backed by the shared frontend storage key ('campus_classifieds_listings').
 * No fake/filler data is automatically presented.
 * When a real backend API is connected, this service layer will execute HTTP
 * requests without requiring UI component rewrites.
 * ============================================================================
 */

import { CATEGORIES } from '../data/categories.js';

const STORAGE_KEY = 'campus_classifieds_listings';

function getStoredListings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse local listings:', e);
  }
  return [];
}

export const listingService = {
  /**
   * Fetch marketplace listings with optional search, category, condition, price, and sorting.
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  getListings: async (filters = {}) => {
    let results = getStoredListings();

    // Category filter (handles both category id and categoryName, e.g. 'bicycles' or 'Bicycle')
    if (filters.category && filters.category !== 'all') {
      const targetCat = filters.category.toLowerCase().replace(/s$/, '');
      results = results.filter((item) => {
        const itemCat = (item.category || '').toLowerCase().replace(/s$/, '');
        const itemCatName = (item.categoryName || '').toLowerCase().replace(/s$/, '');
        return itemCat === targetCat || itemCatName === targetCat;
      });
    }

    // Search query filter (title and description)
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q)
      );
    }

    // Condition filter
    if (filters.condition && filters.condition !== 'all') {
      results = results.filter((item) => item.condition === filters.condition);
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      results = results.filter((item) => item.status === filters.status);
    }

    // Price range filters
    if (filters.minPrice !== undefined && filters.minPrice !== '') {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min)) results = results.filter((item) => item.price >= min);
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max)) results = results.filter((item) => item.price <= max);
    }

    // Sorting
    if (filters.sort === 'price-low') {
      results.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'price-high') {
      results.sort((a, b) => b.price - a.price);
    } else {
      results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return results;
  },

  /**
   * Fetch a single listing by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  getListingById: async (id) => {
    if (!id) return null;
    const listings = getStoredListings();
    const item = listings.find((listing) => listing.id === id);
    return item || null;
  },

  /**
   * Fetch related listings in the same category.
   * @param {string} category
   * @param {string} currentId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  getRelatedListings: async (category, currentId, limit = 3) => {
    const listings = getStoredListings();
    return listings.filter(
      (item) => item.category === category && item.id !== currentId
    ).slice(0, limit);
  },

  /**
   * Fetch all campus categories.
   * @returns {Promise<Array>}
   */
  getCategories: async () => {
    return CATEGORIES;
  },
};

export default listingService;
