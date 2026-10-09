import React, { useState, useEffect, useCallback } from 'react';
import { 
  listingService, 
  normalizeCategoryForBackend, 
  normalizeConditionForBackend,
  isFillerOrMockListing 
} from '../services/listingService';
import { useAuth } from '../hooks/useAuth';
import { ListingContext } from './ListingContextObject';

export function ListingProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  /**
   * Fetch active marketplace listings from backend.
   */
  const fetchListings = useCallback(async (query = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listingService.getListings(query);
      setListings(res.listings || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
      return res.listings;
    } catch (err) {
      console.error('Failed to fetch listings from backend:', err);
      setError(err?.message || 'Unable to load marketplace listings.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch current user's listings from backend.
   */
  const fetchMyListings = useCallback(async (query = {}) => {
    if (!isAuthenticated) {
      setMyListings([]);
      return [];
    }

    try {
      const res = await listingService.getMyListings(query);
      setMyListings(res.listings || []);
      return res.listings;
    } catch (err) {
      console.warn('Failed to fetch my listings:', err);
      return [];
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Load user listings on auth state change
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyListings();
    } else {
      setMyListings([]);
    }
  }, [isAuthenticated, fetchMyListings]);

  /**
   * Create listing + optional image upload pipeline.
   * @param {Object} listingData
   * @param {File[]} [files]
   */
  const addListing = useCallback(async (listingData, files = []) => {
    // 1. Create listing
    let created = await listingService.createListing(listingData);

    // 2. Upload images if provided
    if (files && files.length > 0) {
      try {
        created = await listingService.uploadListingImages(created.id, files);
      } catch (uploadErr) {
        uploadErr.listingCreated = created;
        throw uploadErr;
      }
    }

    // 3. Update state
    setListings((prev) => [created, ...prev.filter((l) => l.id !== created.id)]);
    setMyListings((prev) => [created, ...prev.filter((l) => l.id !== created.id)]);

    return created;
  }, []);

  /**
   * Update an existing listing.
   */
  const updateListing = useCallback(async (id, updates) => {
    const updated = await listingService.updateListing(id, updates);
    setListings((prev) => prev.map((item) => (item.id === id ? updated : item)));
    setMyListings((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  /**
   * Update listing status ('active' <-> 'sold').
   */
  const updateListingStatus = useCallback(async (id, status) => {
    const updated = await listingService.updateListingStatus(id, status);
    setListings((prev) => prev.map((item) => (item.id === id ? updated : item)));
    setMyListings((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const markListingSold = useCallback((id) => {
    return updateListingStatus(id, 'sold');
  }, [updateListingStatus]);

  const relistListingActive = useCallback((id) => {
    return updateListingStatus(id, 'active');
  }, [updateListingStatus]);

  /**
   * Soft-delete a listing.
   */
  const deleteListing = useCallback(async (id) => {
    await listingService.deleteListing(id);
    setListings((prev) => prev.filter((item) => item.id !== id));
    setMyListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'removed' } : item))
    );
  }, []);

  /**
   * Delete an image from a listing.
   */
  const deleteListingImage = useCallback(async (id, publicId) => {
    const updated = await listingService.deleteListingImage(id, publicId);
    setListings((prev) => prev.map((item) => (item.id === id ? updated : item)));
    setMyListings((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  /**
   * Retrieve a single listing by ID.
   */
  const getListingById = useCallback(
    (id) => {
      if (!id) return null;
      const found = (
        listings.find((item) => item.id === id || item._id === id) ||
        myListings.find((item) => item.id === id || item._id === id) ||
        null
      );
      if (found && isFillerOrMockListing(found)) return null;
      return found;
    },
    [listings, myListings]
  );

  /**
   * Synchronous filter helper for in-memory active listings.
   */
  const filterListings = useCallback(
    (filters = {}) => {
      let results = [...listings];

      // Exclude sold items from public browse unless specified
      if (filters.status && filters.status !== 'all') {
        results = results.filter((item) => item.status === filters.status);
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        const targetCat = normalizeCategoryForBackend(filters.category);
        results = results.filter((item) => {
          const itemCat = normalizeCategoryForBackend(item.category);
          return itemCat === targetCat;
        });
      }

      // Search query filter
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
        const targetCond = normalizeConditionForBackend(filters.condition);
        results = results.filter(
          (item) => normalizeConditionForBackend(item.condition) === targetCond
        );
      }

      // Price filters
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
        results.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      }

      return results;
    },
    [listings]
  );

  const value = {
    listings,
    myListings,
    loading,
    error,
    pagination,
    fetchListings,
    fetchMyListings,
    addListing,
    updateListing,
    updateListingStatus,
    markListingSold,
    relistListingActive,
    deleteListing,
    deleteListingImage,
    getListingById,
    filterListings,
  };

  return <ListingContext.Provider value={value}>{children}</ListingContext.Provider>;
}

export default ListingContext;
