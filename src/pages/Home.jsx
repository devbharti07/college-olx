import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  ArrowRight,
  ShieldCheck,
  Search,
  MessageSquare,
  MapPin,
  Coins,
  Zap,
  Sparkles
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { CATEGORIES } from '../data/categories';
import { useListings } from '../context';
import { 
  Button, 
  SearchBar, 
  CategoryCard, 
  ListingCard, 
  Badge,
  EmptyState,
} from '../components';

export default function Home() {
  useDocumentTitle('Student Marketplace');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { listings } = useListings();

  const availableListings = listings.filter((l) => l.status !== 'sold');
  const latestListings = availableListings.slice(0, 8);

  const handleSearch = (query) => {
    if (query && query.trim()) {
      navigate(`/listings?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/listings');
    }
  };

  const quickSearchTags = [
    { label: 'Books', id: 'books' },
    { label: 'Lab Equipment', id: 'lab-equipment' },
    { label: 'Lab Coat', id: 'lab-coat' },
    { label: 'Engineering Drafter', id: 'engineering-drafter' },
    { label: 'Bicycles', id: 'bicycles' },
  ];

  const howItWorksSteps = [
    {
      step: '01',
      title: 'Find an item',
      description: 'Search textbooks, lab coats, drafters, or bicycles posted by students across campus departments.',
      icon: Search,
    },
    {
      step: '02',
      title: 'Contact the seller',
      description: 'Send a quick direct message to verify item condition, ask questions, and agree on price.',
      icon: MessageSquare,
    },
    {
      step: '03',
      title: 'Meet safely on campus',
      description: 'Hand over the item at public campus spots like libraries, cafeterias, or student activity centers.',
      icon: MapPin,
    },
  ];

  const whyChooseUsFeatures = [
    {
      title: 'Campus-Focused',
      description: 'Exclusively built for your university community. No outside strangers, zero shipping hassles, and instant local handovers.',
      icon: MapPin,
    },
    {
      title: 'Student-Friendly',
      description: 'Fair pricing designed for student budgets. Completely free to browse, list, and trade with zero hidden commissions.',
      icon: Coins,
    },
    {
      title: 'Easy Buying and Selling',
      description: 'List your used drafter, textbook, or calculator in under 2 minutes. Simple, uncluttered forms built for mobile.',
      icon: Zap,
    },
    {
      title: 'Verified Student Community',
      description: 'Safe, accountable trading backed by university email (.edu) authentication and transparent student peer ratings.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. HERO SECTION */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-10 lg:p-12 shadow-2xs">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-1.5">
            <Badge variant="primary" size="md" icon={ShieldCheck}>
              College Only • Verified .edu Students
            </Badge>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Buy and sell <span className="text-emerald-700 dark:text-emerald-400">within your campus.</span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              The verified peer-to-peer marketplace for college students. Save on used textbooks, lab equipment, engineering drafters, bicycles, and semester notes directly from your peers.
            </p>
          </div>

          {/* Integrated Search Bar */}
          <div className="space-y-2 pt-1 max-w-2xl">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              placeholder="Search books, lab coats, mini drafters, calculators..."
              size="lg"
            />

            {/* Quick search tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="font-medium text-slate-400 dark:text-slate-500">Popular:</span>
              {quickSearchTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => navigate(`/listings?category=${tag.id}`)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              to="/listings"
              rightIcon={ArrowRight}
            >
              Browse Listings
            </Button>

            <Button
              variant="outline"
              size="md"
              to="/sell"
              leftIcon={PlusCircle}
            >
              Sell an Item
            </Button>
          </div>
        </div>
      </section>

      {/* 2. POPULAR CATEGORIES */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Popular Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Essential gear, books, and supplies needed across semesters and labs
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            to="/listings"
            rightIcon={ArrowRight}
            className="self-start sm:self-auto text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
          >
            All Categories
          </Button>
        </div>

        {/* 8 Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              description={cat.description}
              icon={cat.icon}
              to={`/listings?category=${cat.id}`}
            />
          ))}
        </div>
      </section>

      {/* 3. LATEST LISTINGS */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fresh On Campus</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Latest Listings
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            to="/listings"
            rightIcon={ArrowRight}
            className="self-start sm:self-auto text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
          >
            View All Listings
          </Button>
        </div>

        {/* Dynamic Listings State */}
        {latestListings.length === 0 ? (
          <EmptyState
            title="No listings available yet"
            description="Be the first to list a textbook, lab coat, or engineering gear on campus."
            actionLabel="Post First Listing"
            actionTo="/sell"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {latestListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xs">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <Badge variant="primary" size="sm">
            Simple 3-Step Process
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Buying and selling on Campus Classifieds is safe, direct, and straightforward.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {howItWorksSteps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 space-y-3 relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. WHY CAMPUS CLASSIFIEDS */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <Badge variant="primary" size="sm">
            Campus Advantages
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Why Campus Classifieds
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            A dedicated college marketplace designed around student needs, schedules, and safety.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {whyChooseUsFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="bg-emerald-800 dark:bg-emerald-900 text-white rounded-2xl p-8 sm:p-12 shadow-2xs text-center space-y-5">
        <div className="max-w-2xl mx-auto space-y-2.5">
          <Badge variant="secondary" size="sm" className="bg-emerald-900 text-emerald-200 border-emerald-700">
            Start Selling Today
          </Badge>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Have something you don't need anymore?
          </h2>

          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
            Sell your used drafter, extra textbooks, lab coat, or electronics to students who need them this semester. Declutter your room and earn extra cash.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            to="/sell"
            leftIcon={PlusCircle}
            className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold shadow-xs focus-visible:ring-white"
          >
            Sell an Item
          </Button>

          <Button
            variant="outline"
            size="lg"
            to="/listings"
            className="text-white border-emerald-600 hover:bg-emerald-700/60 hover:text-white"
          >
            Explore Items
          </Button>
        </div>
      </section>
    </div>
  );
}
