import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  LoadingState,
  ErrorState,
} from '../components';

export default function Home() {
  useDocumentTitle('Student Marketplace | Campus Classifieds');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { listings, pagination, loading, error, fetchListings } = useListings();

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
      {/* 1. HERO SECTION - Modern marketplace composition */}
      <section className="relative rounded-3xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] p-6 sm:p-10 lg:p-12 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Main Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2 animate-fade-in">
              <Badge variant="primary" size="md" icon={ShieldCheck}>
                College Only • Verified .edu Students
              </Badge>
              <Link 
                to="/landing" 
                className="text-xs font-semibold text-[#6366F1] dark:text-[#818CF8] hover:underline inline-flex items-center gap-0.5 ml-1"
              >
                <span>About Platform</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#18181B] dark:text-[#FAFAFA] tracking-tight leading-[1.15] animate-fade-in-up delay-75">
                Buy, sell, and exchange <br className="hidden sm:inline" />
                <span className="text-[#6366F1] dark:text-[#818CF8]">within your campus.</span>
              </h1>

              <p className="text-[#71717A] dark:text-[#A1A1AA] text-sm sm:text-base leading-relaxed max-w-xl animate-fade-in-up delay-150">
                The peer-to-peer collegiate marketplace. Trade used engineering drafters, lab equipment, textbooks, and hostel essentials directly with classmates at safe campus meetup spots.
              </p>
            </div>

            {/* Integrated Search Bar */}
            <div className="space-y-2 pt-1 max-w-xl animate-fade-in-up delay-200">
              <SearchBar
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                placeholder="Search textbooks, mini drafters, calculators..."
                size="lg"
              />

              {/* Quick search tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="font-semibold text-[#71717A] dark:text-[#A1A1AA]">Popular:</span>
                {quickSearchTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => navigate(`/listings?category=${tag.id}`)}
                    className="px-2.5 py-1 rounded-md bg-[#FAFAFA] dark:bg-[#27272A] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46] text-[#18181B] dark:text-[#FAFAFA] font-medium transition-colors cursor-pointer border border-[#E4E4E7]/60 dark:border-[#27272A]"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 animate-fade-in-up delay-300">
              <Button
                variant="primary"
                size="md"
                to="/listings"
                rightIcon={ArrowRight}
                className="font-semibold campus-interactive-lift"
              >
                Browse Listings
              </Button>

              <Button
                variant="outline"
                size="md"
                to="/sell"
                leftIcon={PlusCircle}
                className="font-semibold campus-interactive-lift"
              >
                Sell an Item
              </Button>
            </div>
          </div>

          {/* Side Marketplace Panel */}
          <div className="lg:col-span-5 flex flex-col gap-3.5 animate-fade-in-up delay-200">
            <div className="p-5 rounded-2xl bg-[#FAFAFA] dark:bg-[#27272A]/50 border border-[#E4E4E7] dark:border-[#27272A] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E4E7] dark:border-[#27272A]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                  Campus Standards
                </span>
                <span className="text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                  Direct Peer-to-Peer
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 dark:bg-[#818CF8]/10 text-[#6366F1] dark:text-[#818CF8] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#18181B] dark:text-[#FAFAFA] block">Direct Student Handovers</span>
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">No delivery fees or outside strangers. Meet right inside campus.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 dark:bg-[#818CF8]/10 text-[#6366F1] dark:text-[#818CF8] flex items-center justify-center shrink-0 mt-0.5">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#18181B] dark:text-[#FAFAFA] block">100% Free Peer Trading</span>
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Zero commission fees on buying or selling your study supplies.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 dark:bg-[#818CF8]/10 text-[#6366F1] dark:text-[#818CF8] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#18181B] dark:text-[#FAFAFA] block">Safe Public Meeting Spots</span>
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Trade at the library, student center, or daytime cafeteria.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between text-xs">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Active campus listings:</span>
                <span className="font-bold text-[#18181B] dark:text-[#FAFAFA] font-mono">
                  {loading ? '—' : (pagination?.total ?? availableListings.length)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR CATEGORIES */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
              Popular Categories
            </h2>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
              Essential gear, books, and supplies needed across semesters and labs
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            to="/listings"
            rightIcon={ArrowRight}
            className="self-start sm:self-auto text-[#6366F1] dark:text-[#818CF8] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC]"
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
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#6366F1] dark:text-[#818CF8] mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fresh On Campus</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
              Latest Listings
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            to="/listings"
            rightIcon={ArrowRight}
            className="self-start sm:self-auto text-[#6366F1] dark:text-[#818CF8] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC]"
          >
            View All Listings
          </Button>
        </div>

        {/* Dynamic Listings State */}
        {loading ? (
          <LoadingState
            type="skeleton-grid"
            count={4}
            message="Loading latest campus items..."
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
        ) : latestListings.length === 0 ? (
          <EmptyState
            title="No listings available yet"
            description="Be the first to list a textbook, lab coat, or engineering gear on campus."
            actionText="Post First Listing"
            actionTo="/sell"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {latestListings.map((listing, idx) => (
              <ListingCard
                key={listing.id || listing._id}
                listing={listing}
                className={`animate-fade-in-up stagger-${(idx % 8) + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="space-y-6 bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-2xl p-6 sm:p-10 shadow-2xs">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <Badge variant="primary" size="sm">
            Simple 3-Step Process
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
            Buying and selling on Campus Classifieds is safe, direct, and straightforward.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {howItWorksSteps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-5 rounded-xl bg-[#FAFAFA] dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#27272A] space-y-3 relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] dark:bg-[#312E81]/40 text-[#4F46E5] dark:text-[#A5B4FC] flex items-center justify-center font-bold text-sm">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] font-mono tracking-wider">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#18181B] dark:text-[#FAFAFA]">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
            Why Campus Classifieds
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-xl">
            A dedicated college marketplace designed around student needs, schedules, and safety.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {whyChooseUsFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] dark:bg-[#312E81]/40 text-[#6366F1] dark:text-[#818CF8] border border-[#6366F1]/20 dark:border-[#818CF8]/20 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-[#18181B] dark:text-[#FAFAFA]">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] text-[#18181B] dark:text-[#FAFAFA] rounded-2xl p-8 sm:p-12 shadow-2xs text-center space-y-5">
        <div className="max-w-2xl mx-auto space-y-2.5">
          <Badge variant="neutral" size="sm">
            Start Selling Today
          </Badge>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Have something you don't need anymore?
          </h2>

          <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
            Sell your used drafter, extra textbooks, lab coat, or electronics to students who need them this semester. Declutter your room and earn extra cash.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            to="/sell"
            leftIcon={PlusCircle}
          >
            Sell an Item
          </Button>

          <Button
            variant="outline"
            size="lg"
            to="/listings"
          >
            Explore Items
          </Button>
        </div>
      </section>
    </div>
  );
}
