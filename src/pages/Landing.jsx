import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  PlusCircle, 
  MapPin, 
  MessageSquare, 
  Coins, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useListings } from '../context';
import { CATEGORIES } from '../data/categories';
import { Button, Badge, ListingCard, LoadingState, ErrorState, EmptyState } from '../components';

export default function Landing() {
  useDocumentTitle('Campus Classifieds | Verified College Peer-to-Peer Marketplace');
  const { listings, loading, error, fetchListings } = useListings();

  // Filter real active listings only
  const activeListings = Array.isArray(listings) ? listings.filter((l) => l.status === 'active') : [];
  const previewListings = activeListings.slice(0, 4);

  const pillars = [
    {
      title: 'Verified Student ID & College Domain',
      description: 'Zero anonymous sellers or commercial dropshippers. Access is restricted exclusively to validated university affiliates.',
      icon: ShieldCheck,
      pill: 'Trust Invariant',
    },
    {
      title: 'Handover at Campus Spots',
      description: 'Exchange items at public university locations like central libraries, student center atriums, or campus cafeterias.',
      icon: MapPin,
      pill: 'Instant Handoff',
    },
    {
      title: 'Direct Peer-to-Peer Chat',
      description: 'Coordinate pricing, inspect equipment condition, and arrange meeting times directly through real-time encrypted chat.',
      icon: MessageSquare,
      pill: 'Zero Intermediaries',
    },
    {
      title: 'Student Budget Fair Value',
      description: 'Recycle expensive semester textbooks, lab coats, and engineering calculators from seniors to freshers without commission cuts.',
      icon: Coins,
      pill: 'Cost Saving',
    },
  ];

  const howItWorks = [
    {
      num: '01',
      title: 'Sign In With College Credentials',
      description: 'Authenticate securely through Keycloak with your collegiate email address to unlock trading privileges.',
    },
    {
      num: '02',
      title: 'Browse or List Semester Gear',
      description: 'Search textbooks, lab kits, and bicycles, or publish what you no longer need in under 90 seconds.',
    },
    {
      num: '03',
      title: 'Meet On Campus & Exchange',
      description: 'Agree on a time, meet at a well-lit campus rendezvous spot, inspect the item in person, and complete the handoff.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-4">
      {/* 1. HERO SECTION - Editorial, marketplace-specific visual composition */}
      <section className="relative rounded-3xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] p-6 sm:p-12 lg:p-16 shadow-2xs overflow-hidden">
        {/* Subtle grid accent background */}
        <div 
          aria-hidden="true" 
          className="absolute inset-0 bg-[radial-gradient(#E4E4E7_1px,transparent_1px)] dark:bg-[radial-gradient(#27272A_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" 
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6366F1]/10 dark:bg-[#818CF8]/10 border border-[#6366F1]/20 dark:border-[#818CF8]/20 text-[#6366F1] dark:text-[#818CF8] text-xs font-semibold animate-fade-in">
            <GraduationCap className="w-4 h-4" />
            <span>Exclusively for verified college students</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#18181B] dark:text-[#FAFAFA] tracking-tight leading-[1.1] animate-fade-in-up delay-75">
            Buy, sell, and exchange <br className="hidden sm:inline" />
            <span className="text-[#6366F1] dark:text-[#818CF8]">within your campus.</span>
          </h1>

          <p className="text-sm sm:text-lg text-[#71717A] dark:text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-150">
            The clean, direct marketplace built for university life. Connect with classmates to trade used textbooks, engineering drafters, lab equipment, cycles, and hostel items safely on campus.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 animate-fade-in-up delay-300">
            <Button
              variant="primary"
              size="lg"
              to="/listings"
              rightIcon={ArrowRight}
              className="w-full sm:w-auto font-semibold campus-interactive-lift"
            >
              Browse Marketplace
            </Button>
            <Button
              variant="outline"
              size="lg"
              to="/sell"
              leftIcon={PlusCircle}
              className="w-full sm:w-auto font-semibold campus-interactive-lift"
            >
              Post an Item for Sale
            </Button>
          </div>

          {/* Quick campus categories ticker */}
          <div className="pt-6 border-t border-[#E4E4E7] dark:border-[#27272A] flex flex-wrap items-center justify-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <span className="font-semibold text-[#18181B] dark:text-[#FAFAFA]">Frequently Traded:</span>
            {['Textbooks', 'Lab Coats', 'Mini Drafters', 'Calculators', 'Bicycles', 'Hostel Essentials'].map((item) => (
              <span 
                key={item} 
                className="px-2.5 py-1 rounded-md bg-[#FAFAFA] dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#27272A] text-[#18181B] dark:text-[#FAFAFA] font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 2. REAL MARKETPLACE ACTIVITY PREVIEW */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366F1] dark:text-[#818CF8] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real Marketplace Feed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
              Recent Campus Postings
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            to="/listings"
            rightIcon={ArrowRight}
            className="self-start sm:self-auto text-[#6366F1] dark:text-[#818CF8]"
          >
            Explore All Listings
          </Button>
        </div>

        {loading ? (
          <LoadingState type="skeleton-grid" count={4} message="Fetching current campus listings..." />
        ) : error ? (
          <ErrorState
            title="Marketplace preview unavailable"
            message={error}
            onRetry={() => fetchListings()}
            retryText="Retry"
            actionText="Go to Listings"
            actionTo="/listings"
          />
        ) : previewListings.length === 0 ? (
          <EmptyState
            title="No active listings yet"
            description="The marketplace feed is fresh. Be the first verified student to post an item today."
            actionText="Sell First Item"
            actionTo="/sell"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {previewListings.map((listing, idx) => (
              <ListingCard 
                key={listing.id || listing._id} 
                listing={listing} 
                className={`animate-fade-in-up stagger-${(idx % 4) + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. CORE VALUE PILLARS */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge variant="primary" size="sm">
            Purpose-Built
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
            Why Campus Classifieds Works
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
            Standard commercial platforms aren't built for student campuses. Here's how we keep trading safe and practical.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-6 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 dark:bg-[#818CF8]/10 text-[#6366F1] dark:text-[#818CF8] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                      {pillar.pill}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#18181B] dark:text-[#FAFAFA] leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. DISCOVER CATEGORIES */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <Badge variant="primary" size="sm">
              Academic & Hostel
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight mt-1">
              Browse by Department Category
            </h2>
          </div>
          <Link
            to="/listings"
            className="text-xs sm:text-sm font-semibold text-[#6366F1] dark:text-[#818CF8] hover:underline inline-flex items-center gap-1"
          >
            <span>View All Categories</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon || BookOpen;
            return (
              <Link
                key={cat.id}
                to={`/listings?category=${cat.id}`}
                className="group p-4 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] hover:border-[#6366F1]/40 dark:hover:border-[#818CF8]/40 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FAFAFA] dark:bg-[#27272A] text-[#18181B] dark:text-[#FAFAFA] group-hover:bg-[#6366F1]/10 group-hover:text-[#6366F1] dark:group-hover:text-[#818CF8] flex items-center justify-center transition-colors shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#18181B] dark:text-[#FAFAFA] truncate group-hover:text-[#6366F1] dark:group-hover:text-[#818CF8] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] truncate">
                    {cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. HOW IT WORKS - 3 STEP ROADMAP */}
      <section className="rounded-3xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] p-6 sm:p-12 shadow-2xs space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge variant="primary" size="sm">
            Frictionless Process
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
            How Campus Meetups Work
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
            Simple, peer-to-peer, and fully campus-contained in three clear steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {howItWorks.map((step) => (
            <div
              key={step.num}
              className="p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#27272A]/50 border border-[#E4E4E7] dark:border-[#27272A] space-y-3 relative flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-[#6366F1] dark:text-[#818CF8] bg-[#6366F1]/10 dark:bg-[#818CF8]/10 px-2 py-0.5 rounded">
                  STEP {step.num}
                </span>
                <h3 className="text-base font-bold text-[#18181B] dark:text-[#FAFAFA] pt-1">
                  {step.title}
                </h3>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. TRUST & SAFETY INVARIANTS */}
      <section className="rounded-3xl border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] p-6 sm:p-12 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <Badge variant="success" size="sm" icon={ShieldCheck}>
              Verified Community Standards
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
              Safe transactions built on collegiate accountability
            </h2>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              Every participant on Campus Classifieds is an active university member authenticated through institutional domain credentials. We do not support third-party courier shipping or blind remote payments; every handover happens in person at trusted campus spots.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-[#18181B] dark:text-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E] shrink-0" />
                <span>Verified .edu student logins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E] shrink-0" />
                <span>Public library & lounge meeting spots</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E] shrink-0" />
                <span>Instant in-person gear inspection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E] shrink-0" />
                <span>Active campus moderation & reporting</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#27272A]/40 border border-[#E4E4E7] dark:border-[#27272A] space-y-4">
            <h3 className="text-sm font-bold text-[#18181B] dark:text-[#FAFAFA]">
              Recommended Meetup Points
            </h3>
            <ul className="space-y-2.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
                <span>University Central Library Lobby</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
                <span>Student Activity Center (SAC) Atrium</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
                <span>Campus Main Cafeteria During Daytime</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
                <span>Engineering Block Quadrangle</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="rounded-3xl bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] p-8 sm:p-14 text-center space-y-6 shadow-sm">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to pass on your semester gear?
          </h2>
          <p className="text-white/90 dark:text-[#09090B]/90 text-xs sm:text-base leading-relaxed">
            Join hundreds of classmates recycling books, lab gear, and campus equipment. Clean out your room and earn extra cash today.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="lg"
            to="/sell"
            leftIcon={PlusCircle}
            className="bg-white text-[#18181B] hover:bg-neutral-100 dark:bg-[#09090B] dark:text-[#FAFAFA] dark:hover:bg-neutral-900 border-transparent shadow-xs font-semibold"
          >
            List an Item Now
          </Button>
          <Button
            variant="outline"
            size="lg"
            to="/listings"
            className="border-white/40 text-white hover:bg-white/10 dark:border-[#09090B]/40 dark:text-[#09090B] dark:hover:bg-[#09090B]/10 font-semibold"
          >
            Explore Campus Listings
          </Button>
        </div>
      </section>
    </div>
  );
}
