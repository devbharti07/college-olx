import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  PlusCircle, 
  Filter, 
  X, 
  RefreshCcw, 
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { CATEGORIES } from '../data/categories';
import { useListings } from '../context';
import { 
  SearchBar, 
  ListingCard, 
  Button, 
  Badge, 
  EmptyState, 
  LoadingState,
  ErrorState,
} from '../components';

export default function Listings() {
  useDocumentTitle('Campus Listings | Marketplace');
  const [searchParams, setSearchParams] = useSearchParams();
  const { listings, pagination, loading, error, fetchListings } = useListings();

  // URL Query Parameters initialization
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('q') || searchParams.get('search') || '';
  const initialCondition = searchParams.get('condition') || 'all';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialSort = searchParams.get('sort') || 'newest';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCondition, setSelectedCondition] = useState(initialCondition);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Mobile Filter Drawer State
  const [mobileFiltersOpen, setMobileMenuFiltersOpen] = useState(false);

  // Sync state if URL search parameters change externally
  const currentCategoryParam = searchParams.get('category') || 'all';
  const currentSearchParam = searchParams.get('q') || searchParams.get('search') || '';
  const currentConditionParam = searchParams.get('condition') || 'all';
  const currentMinPriceParam = searchParams.get('minPrice') || '';
  const currentMaxPriceParam = searchParams.get('maxPrice') || '';
  const currentSortParam = searchParams.get('sort') || 'newest';
  const currentPageParam = parseInt(searchParams.get('page') || '1', 10);

  const [prevParams, setPrevParams] = useState(() => searchParams.toString());
  const currentParamsStr = searchParams.toString();
  if (currentParamsStr !== prevParams) {
    setPrevParams(currentParamsStr);
    setSelectedCategory(currentCategoryParam);
    setSearchQuery(currentSearchParam);
    setSelectedCondition(currentConditionParam);
    setMinPrice(currentMinPriceParam);
    setMaxPrice(currentMaxPriceParam);
    setSortBy(currentSortParam);
    setCurrentPage(currentPageParam);
  }

  // Update URL search parameters
  const updateUrlParams = useCallback(
    (updates = {}) => {
      const nextParams = new URLSearchParams(searchParams);

      const merged = {
        search: searchQuery,
        category: selectedCategory,
        condition: selectedCondition,
        minPrice,
        maxPrice,
        sort: sortBy,
        page: currentPage,
        ...updates,
      };

      // If changing filters, reset to page 1 unless page is explicitly specified
      if (
        !('page' in updates) &&
        ('search' in updates ||
          'category' in updates ||
          'condition' in updates ||
          'minPrice' in updates ||
          'maxPrice' in updates ||
          'sort' in updates)
      ) {
        merged.page = 1;
      }

      Object.entries(merged).forEach(([key, val]) => {
        if (
          !val ||
          val === 'all' ||
          (key === 'sort' && val === 'newest') ||
          (key === 'page' && Number(val) === 1)
        ) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, val);
        }
      });

      setSearchParams(nextParams);
    },
    [
      searchParams,
      searchQuery,
      selectedCategory,
      selectedCondition,
      minPrice,
      maxPrice,
      sortBy,
      currentPage,
      setSearchParams,
    ]
  );

  // Fetch real listings from backend API whenever query parameters change
  useEffect(() => {
    fetchListings({
      search: currentSearchParam,
      category: currentCategoryParam,
      condition: currentConditionParam,
      minPrice: currentMinPriceParam,
      maxPrice: currentMaxPriceParam,
      sort: currentSortParam,
      page: currentPageParam,
      limit: 20,
    });
  }, [
    fetchListings,
    currentSearchParam,
    currentCategoryParam,
    currentConditionParam,
    currentMinPriceParam,
    currentMaxPriceParam,
    currentSortParam,
    currentPageParam,
  ]);

  // Debounce search query input to avoid hammering API while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== currentSearchParam) {
        updateUrlParams({ search: searchQuery, page: 1 });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, currentSearchParam, updateUrlParams]);

  const handleSearchSubmit = (val) => {
    setSearchQuery(val);
    updateUrlParams({ search: val, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  // Conditions list
  const conditions = [
    { id: 'all', label: 'All Conditions' },
    { id: 'New', label: 'New' },
    { id: 'Like New', label: 'Like New' },
    { id: 'Good', label: 'Good' },
    { id: 'Fair', label: 'Fair' },
  ];

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedCondition !== 'all') count++;
    if (minPrice !== '') count++;
    if (maxPrice !== '') count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  }, [selectedCategory, selectedCondition, minPrice, maxPrice, searchQuery]);

  // Reusable filter sidebar controls
  const filterControls = (
    <div className="space-y-6">
      {/* 1. Category Filter */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] block">
          Category
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              updateUrlParams({ category: 'all' });
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#EEF2FF] dark:bg-[#312E81]/30 text-[#4F46E5] dark:text-[#A5B4FC] font-bold'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]'
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-[#6366F1] dark:text-[#818CF8]" />}
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  updateUrlParams({ category: cat.id });
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#EEF2FF] dark:bg-[#312E81]/30 text-[#4F46E5] dark:text-[#A5B4FC] font-bold'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]'
                }`}
              >
                <span>{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#6366F1] dark:text-[#818CF8]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Condition Filter */}
      <div className="space-y-2.5 pt-4 border-t border-[#E4E4E7] dark:border-[#27272A]">
        <label className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] block">
          Condition
        </label>
        <div className="space-y-1">
          {conditions.map((cond) => {
            const isSelected = selectedCondition === cond.id;
            return (
              <button
                key={cond.id}
                type="button"
                onClick={() => {
                  setSelectedCondition(cond.id);
                  updateUrlParams({ condition: cond.id });
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#EEF2FF] dark:bg-[#312E81]/30 text-[#4F46E5] dark:text-[#A5B4FC] font-bold'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]'
                }`}
              >
                <span>{cond.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#6366F1] dark:text-[#818CF8]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Price Range (₹) */}
      <div className="space-y-2.5 pt-4 border-t border-[#E4E4E7] dark:border-[#27272A]">
        <label className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] block">
          Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-medium block mb-1">Min (₹)</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                updateUrlParams({ minPrice: e.target.value });
              }}
              className="w-full text-xs p-2 rounded-lg bg-[#FAFAFA] dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#27272A] text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8]"
            />
          </div>
          <div>
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-medium block mb-1">Max (₹)</span>
            <input
              type="number"
              min="0"
              placeholder="5000"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                updateUrlParams({ maxPrice: e.target.value });
              }}
              className="w-full text-xs p-2 rounded-lg bg-[#FAFAFA] dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#27272A] text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8]"
            />
          </div>
        </div>

        {/* Quick price tags in INR */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: 'Under ₹500', min: '', max: '500' },
            { label: '₹500 - ₹1,500', min: '500', max: '1500' },
            { label: '₹1,500+', min: '1500', max: '' },
          ].map((range, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setMinPrice(range.min);
                setMaxPrice(range.max);
                updateUrlParams({ minPrice: range.min, maxPrice: range.max });
              }}
              className="px-2 py-1 rounded-md text-[11px] bg-[#F4F4F5] dark:bg-[#27272A] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46] text-[#18181B] dark:text-[#FAFAFA] font-medium transition-colors cursor-pointer"
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Action */}
      {activeFiltersCount > 0 && (
        <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#27272A]">
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={handleResetFilters}
            leftIcon={RefreshCcw}
            className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA]"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Campus Listings"
        description="Search textbooks, drafters, coats, cycles, and lab supplies posted by verified students."
        actions={
          <Button
            variant="primary"
            size="sm"
            to="/sell"
            leftIcon={PlusCircle}
          >
            Post an Item
          </Button>
        }
      />

      {/* Interactive Controls Bar: Search, Mobile Filter Toggle, and Sort Dropdown */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Main search bar */}
          <div className="flex-1 max-w-xl">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearchSubmit}
              placeholder="Search books, lab coats, mini drafters, calculators..."
              size="md"
            />
          </div>

          {/* Right side controls: Mobile Filter button + Sort dropdown */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {/* Mobile Filter Drawer Button */}
            <Button
              variant="outline"
              size="md"
              onClick={() => setMobileMenuFiltersOpen(true)}
              leftIcon={SlidersHorizontal}
              className="md:hidden"
            >
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>

            {/* Sort by dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium hidden sm:inline">Sort:</span>
              <select
                id="listings-sort-select"
                aria-label="Sort listings"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateUrlParams({ sort: e.target.value });
                }}
                className="py-2 px-3 text-xs bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-lg focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:outline-none font-medium text-[#18181B] dark:text-[#FAFAFA] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E4E4E7] dark:border-[#27272A] text-xs">
            <span className="text-[#71717A] dark:text-[#A1A1AA] font-medium mr-1">Active:</span>

            {selectedCategory !== 'all' && (
              <Badge
                variant="primary"
                size="sm"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  setSelectedCategory('all');
                  updateUrlParams({ category: 'all' });
                }}
              >
                <span>Category: {CATEGORIES.find((c) => c.id === selectedCategory)?.name || selectedCategory}</span>
                <X className="w-3 h-3 ml-0.5" />
              </Badge>
            )}

            {selectedCondition !== 'all' && (
              <Badge
                variant="default"
                size="sm"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  setSelectedCondition('all');
                  updateUrlParams({ condition: 'all' });
                }}
              >
                <span>Condition: {selectedCondition}</span>
                <X className="w-3 h-3 ml-0.5" />
              </Badge>
            )}

            {minPrice !== '' && (
              <Badge
                variant="default"
                size="sm"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  setMinPrice('');
                  updateUrlParams({ minPrice: '' });
                }}
              >
                <span>Min: ₹{minPrice}</span>
                <X className="w-3 h-3 ml-0.5" />
              </Badge>
            )}

            {maxPrice !== '' && (
              <Badge
                variant="default"
                size="sm"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  setMaxPrice('');
                  updateUrlParams({ maxPrice: '' });
                }}
              >
                <span>Max: ₹{maxPrice}</span>
                <X className="w-3 h-3 ml-0.5" />
              </Badge>
            )}

            {searchQuery && (
              <Badge
                variant="default"
                size="sm"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  setSearchQuery('');
                  updateUrlParams({ search: '' });
                }}
              >
                <span>Query: "{searchQuery}"</span>
                <X className="w-3 h-3 ml-0.5" />
              </Badge>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#6366F1] dark:text-[#818CF8] hover:underline ml-2"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Main Layout: Desktop Sidebar Filters + Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block md:col-span-3 bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl p-5 shadow-2xs sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#27272A] mb-4">
            <h3 className="font-bold text-[#18181B] dark:text-[#FAFAFA] text-sm flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8]" />
              <span>Filter Items</span>
            </h3>
            {activeFiltersCount > 0 && (
              <Badge variant="primary" size="sm">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          {filterControls}
        </aside>

        {/* Listings Grid Area */}
        <main className="md:col-span-9">
          {loading ? (
            <LoadingState
              type="skeleton-grid"
              count={6}
              message="Fetching live campus listings..."
            />
          ) : error ? (
            <ErrorState
              title="Unable to Load Marketplace Listings"
              message={error}
              onRetry={() => fetchListings()}
              retryText="Retry Connection"
              actionText="Post an Item"
              actionTo="/sell"
            />
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {listings.map((listing, idx) => (
                  <ListingCard
                    key={listing.id || listing._id}
                    listing={listing}
                    className={`animate-fade-in-up stagger-${(idx % 8) + 1}`}
                  />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#E4E4E7] dark:border-[#27272A] pt-6 mt-6">
                  <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">
                    Showing page <span className="font-bold text-[#18181B] dark:text-[#FAFAFA]">{pagination.page}</span> of{' '}
                    <span className="font-bold text-[#18181B] dark:text-[#FAFAFA]">{pagination.totalPages}</span>{' '}
                    ({pagination.total} {pagination.total === 1 ? 'item' : 'items'})
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrev && !pagination.hasPreviousPage}
                      onClick={() => updateUrlParams({ page: (pagination.page || 1) - 1 })}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext && !pagination.hasNextPage}
                      onClick={() => updateUrlParams({ page: (pagination.page || 1) + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : activeFiltersCount > 0 ? (
            <EmptyState
              title="No listings available yet"
              description="We couldn't find any items matching your active search or filters. Try adjusting your parameters or post an item for students on campus."
              actionText="Reset All Filters"
              onActionClick={handleResetFilters}
              actionIcon={RefreshCcw}
              secondaryActionText="Post an Item"
              secondaryActionTo="/sell"
            />
          ) : (
            <EmptyState
              title="No listings available yet"
              description="No items have been listed for sale yet. Be the first to list a textbook, lab coat, or engineering gear for campus peers."
              actionText="Post First Listing"
              actionTo="/sell"
              actionIcon={PlusCircle}
            />
          )}
        </main>
      </div>

      {/* Responsive Mobile Filter Drawer Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuFiltersOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white dark:bg-[#18181B] shadow-xl flex flex-col justify-between animate-fade-in">
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8]" />
                  <h3 className="font-bold text-[#18181B] dark:text-[#FAFAFA] text-sm">Filters & Refinements</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuFiltersOpen(false)}
                  className="p-1 rounded-lg text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA]"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-4 overflow-y-auto flex-1">
                {filterControls}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#09090B] flex items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => setMobileMenuFiltersOpen(false)}
                >
                  Show {listings.length}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
