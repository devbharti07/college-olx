import React, { useState, useEffect, useCallback } from 'react';
import { CATEGORIES } from '../data/categories';
import { ListingContext } from './ListingContextObject';

const STORAGE_KEY = 'campus_classifieds_listings';

/**
 * Validates whether an object has the required listing fields.
 */
function isValidListing(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.price === 'number'
  );
}

export function ListingProvider({ children }) {
  // Initialize listings from localStorage safely (with corrupted storage handling)
  const [listings, setListings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(isValidListing);
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored listings, initializing with empty listings:', e);
    }
    // Clean initial state: zero filler listings
    return [];
  });

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
    } catch (e) {
      console.warn('Failed to persist listings to localStorage:', e);
    }
  }, [listings]);

  /**
   * Add a new listing to frontend state and persistence.
   */
  const addListing = useCallback((listingData) => {
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Resolve category name and id safely
    const categoryRaw = listingData.category || 'other';
    const categoryObj = CATEGORIES.find(
      (c) => c.id === categoryRaw || c.name.toLowerCase() === categoryRaw.toLowerCase()
    );
    const categoryName = listingData.categoryName || categoryObj?.name || categoryRaw;
    const categoryId = categoryObj?.id || categoryRaw.toLowerCase().replace(/\s+/g, '-');

    const numPrice = typeof listingData.price === 'number'
      ? listingData.price
      : parseFloat(listingData.price) || 0;

    const newListing = {
      id,
      title: listingData.title?.trim() || 'Untitled Listing',
      description: listingData.description?.trim() || '',
      price: numPrice,
      category: categoryId,
      categoryName,
      condition: listingData.condition || 'Good',
      location: listingData.location?.trim() || 'Campus Meetup',
      postedAt: 'Just now',
      createdAt: Date.now(),
      status: 'available', // 'available' | 'sold'
      images: Array.isArray(listingData.images) ? listingData.images : [],
      seller: listingData.seller || {
        name: 'You (Student)',
        department: 'Campus Member',
        verified: true,
      },
      viewsCount: 0,
      inquiriesCount: 0,
    };

    setListings((prev) => [newListing, ...prev]);
    return newListing;
  }, []);

  /**
   * Update an existing listing.
   */
  const updateListing = useCallback((id, updates) => {
    setListings((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedCategory = updates.category !== undefined ? updates.category : item.category;
          const catObj = CATEGORIES.find(
            (c) => c.id === updatedCategory || c.name.toLowerCase() === (updatedCategory || '').toLowerCase()
          );
          const numPrice = updates.price !== undefined
            ? (typeof updates.price === 'number' ? updates.price : parseFloat(updates.price) || 0)
            : item.price;

          return {
            ...item,
            ...updates,
            price: numPrice,
            category: catObj?.id || updatedCategory,
            categoryName: updates.categoryName || catObj?.name || item.categoryName,
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Delete a listing by ID.
   */
  const deleteListing = useCallback((id) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * Mark a listing as sold.
   */
  const markListingSold = useCallback((id, soldTo = 'Campus Student') => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'sold', soldTo } : item
      )
    );
  }, []);

  /**
   * Re-list an item as active/available.
   */
  const relistListingActive = useCallback((id) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'available', soldTo: undefined } : item
      )
    );
  }, []);

  /**
   * Retrieve a single listing by ID.
   */
  const getListingById = useCallback(
    (id) => {
      if (!id) return null;
      return listings.find((item) => item.id === id) || null;
    },
    [listings]
  );

  /**
   * Filter and sort listings according to search, category, condition, price, and sort criteria.
   */
  const filterListings = useCallback(
    (filters = {}) => {
      let results = [...listings];

      // Category filter (handles category ID and name variations)
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
            item.title.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.categoryName?.toLowerCase().includes(q)
        );
      }

      // Condition filter
      if (filters.condition && filters.condition !== 'all') {
        results = results.filter((item) => item.condition === filters.condition);
      }

      // Status filter ('available' | 'sold' | 'all')
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
        // Default: newest first by timestamp
        results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }

      return results;
    },
    [listings]
  );

  const value = {
    listings,
    addListing,
    updateListing,
    deleteListing,
    markListingSold,
    relistListingActive,
    getListingById,
    filterListings,
  };

  return (
    <ListingContext.Provider value={value}>
      {children}
    </ListingContext.Provider>
  );
}

export default ListingContext;
