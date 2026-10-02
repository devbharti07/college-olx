import React, { useState, useMemo } from 'react';
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
} from '../components';

export default function Listings() {
  useDocumentTitle('Campus Listings | Marketplace');
  const [searchParams, setSearchParams] = useSearchParams();
  const { filterListings } = useListings();

  // URL Query Parameters initialization
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';
  const initialCondition = searchParams.get('condition') || 'all';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialSort = searchParams.get('sort') || 'newest';

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCondition, setSelectedCondition] = useState(initialCondition);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sortBy, setSortBy] = useState(initialSort);

  // Mobile Filter Drawer State
  const [mobileFiltersOpen, setMobileMenuFiltersOpen] = useState(false);

  // Sync state if URL search parameters change externally
  const currentCategoryParam = searchParams.get('category') || 'all';
  const currentSearchParam = searchParams.get('search') || '';
  const currentConditionParam = searchParams.get('condition') || 'all';
  const currentMinPriceParam = searchParams.get('minPrice') || '';
  const currentMaxPriceParam = searchParams.get('maxPrice') || '';
  const currentSortParam = searchParams.get('sort') || 'newest';

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
  }

  // Update URL search parameters
  const updateUrlParams = (updates = {}) => {
    const nextParams = new URLSearchParams(searchParams);

    const merged = {
      search: searchQuery,
      category: selectedCategory,
      condition: selectedCondition,
      minPrice,
      maxPrice,
      sort: sortBy,
      ...updates,
    };

    Object.entries(merged).forEach(([key, val]) => {
      if (!val || val === 'all' || (key === 'sort' && val === 'newest')) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val);
      }
    });

    setSearchParams(nextParams);
  };

  // Derive listings directly from shared listing context
  const listings = useMemo(() => {
    return filterListings({
      category: selectedCategory,
      search: searchQuery,
      condition: selectedCondition,
      minPrice,
      maxPrice,
      sort: sortBy,
    });
  }, [filterListings, selectedCategory, searchQuery, selectedCondition, minPrice, maxPrice, sortBy]);

  const handleSearchSubmit = (val) => {
    setSearchQuery(val);
    updateUrlParams({ search: val });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
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
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
          Category
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              updateUrlParams({ category: 'all' });
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Condition Filter */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cond.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Price Range (₹) */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
          Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mb-1">Min (₹)</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                updateUrlParams({ minPrice: e.target.value });
              }}
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mb-1">Max (₹)</span>
            <input
              type="number"
              min="0"
              placeholder="5000"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                updateUrlParams({ maxPrice: e.target.value });
              }}
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600"
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
              className="px-2 py-1 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors"
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Action */}
      {activeFiltersCount > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={handleResetFilters}
            leftIcon={RefreshCcw}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
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
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Sort:</span>
              <select
                id="listings-sort-select"
                aria-label="Sort listings"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateUrlParams({ sort: e.target.value });
                }}
                className="py-2 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium mr-1">Active:</span>

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
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline ml-2"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Main Layout: Desktop Sidebar Filters + Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
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
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                />
              ))}
            </div>
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
            className="fixed inset-0 bg-slate-900/40 transition-opacity"
            onClick={() => setMobileMenuFiltersOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white dark:bg-slate-900 shadow-xl flex flex-col justify-between">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Filters & Refinements</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuFiltersOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2">
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
