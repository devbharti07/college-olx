import React from 'react';
import { Compass, Home, Search } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Button } from '../components';

export default function NotFound() {
  useDocumentTitle('Page Not Found');

  return (
    <div className="max-w-md mx-auto my-16 text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-[#EEF2FF] dark:bg-[#312E81]/40 text-[#6366F1] dark:text-[#818CF8] flex items-center justify-center shadow-xs">
        <Compass className="w-10 h-10" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#6366F1] dark:text-[#818CF8]">404 Error</span>
        <h1 className="text-3xl font-extrabold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
          The campus classifieds page or listing you are looking for does not exist or has been moved.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          variant="primary"
          size="md"
          to="/"
          leftIcon={Home}
        >
          Go Home
        </Button>
        <Button
          variant="outline"
          size="md"
          to="/listings"
          leftIcon={Search}
        >
          Browse Listings
        </Button>
      </div>
    </div>
  );
}
