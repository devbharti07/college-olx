import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Coins, 
  Sparkles, 
  CheckCircle2,
  PlusCircle,
  Zap
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useListings } from '../context';
import { Button, Badge } from '../components';

export default function Hero() {
  useDocumentTitle('Welcome to Campus Classifieds | Student Marketplace');
  const { listings, pagination, loading } = useListings();
  const availableCount = pagination?.total ?? listings.filter((l) => l.status === 'active').length;

  const keyFeatures = [
    {
      icon: ShieldCheck,
      title: 'Institutional .edu Verification',
      desc: 'Only confirmed university students and staff can access or communicate on the marketplace.',
    },
    {
      icon: MapPin,
      title: 'Designated Campus Meetup Zones',
      desc: 'Safely hand over books and gear at library foyers, student center halls, and daytime cafeterias.',
    },
    {
      icon: Coins,
      title: 'Zero Platform Trading Fees',
      desc: 'Keep 100% of your earnings with peer-to-peer cash or direct UPI exchanges.',
    },
    {
      icon: Zap,
      title: 'Under 90-Second Posting',
      desc: 'Snap a picture, choose your condition and price, and publish directly to classmates.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-6 max-w-5xl mx-auto">
      {/* Notion-style minimal Hero Banner */}
      <section className="relative p-8 sm:p-14 rounded-3xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-xs overflow-hidden animate-fade-in-up">
        {/* Subtle grid background */}
        <div 
          aria-hidden="true" 
          className="absolute inset-0 bg-[radial-gradient(#E4E4E7_1px,transparent_1px)] dark:bg-[radial-gradient(#27272A_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" 
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6366F1]/10 dark:bg-[#818CF8]/10 border border-[#6366F1]/20 dark:border-[#818CF8]/20 text-[#6366F1] dark:text-[#818CF8] text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Campus Classifieds • Version 2.0</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#18181B] dark:text-[#FAFAFA] tracking-tight leading-[1.1]">
            Everything students need, <br />
            <span className="text-[#6366F1] dark:text-[#818CF8]">right on campus.</span>
          </h1>

          <p className="text-sm sm:text-lg text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-2xl mx-auto">
            Trade used engineering drafters, lab equipment, course textbooks, bicycles, and room essentials directly with verified students. No outside strangers, zero shipping delays.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              to="/listings"
              rightIcon={ArrowRight}
              className="w-full sm:w-auto font-semibold campus-interactive-lift"
            >
              Enter Marketplace
            </Button>
            <Button
              variant="outline"
              size="lg"
              to="/sell"
              leftIcon={PlusCircle}
              className="w-full sm:w-auto font-semibold campus-interactive-lift"
            >
              List an Item for Free
            </Button>
          </div>

          {/* Real inventory counter */}
          <div className="pt-6 border-t border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-center gap-6 text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E]" />
              <span>Verified student profiles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E]" />
              <span>In-person campus meetups</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#18181B] dark:text-[#FAFAFA]">{loading ? '—' : availableCount}</span>
              <span>Available listings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Notion-style Clean Feature Blocks */}
      <section className="space-y-6">
        <div className="text-center space-y-1.5 max-w-xl mx-auto">
          <Badge variant="primary" size="sm">
            Platform Highlights
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
            Designed for Campus Trading
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
            Built with pure Swiss minimalist layout principles and thoughtful accessibility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {keyFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="notion-callout p-6 campus-interactive-lift space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 dark:bg-[#818CF8]/10 text-[#6366F1] dark:text-[#818CF8] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#18181B] dark:text-[#FAFAFA]">
                  {feat.title}
                </h3>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Direct Quick Launch Callout */}
      <section className="p-8 rounded-3xl bg-[#FAFAFA] dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-[#18181B] dark:text-[#FAFAFA]">
            Need semester supplies or moving out of hostel?
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Connect with other students in your department today.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="primary" size="md" to="/listings">
            Explore All Items
          </Button>
          <Button variant="outline" size="md" to="/landing">
            Read Full Platform Story
          </Button>
        </div>
      </section>
    </div>
  );
}
