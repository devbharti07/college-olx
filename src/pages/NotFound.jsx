import React from 'react';
import { Compass, Home, Search } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Button } from '../components';

export default function NotFound() {
  useDocumentTitle('Page Not Found');

  return (
    <div className="max-w-md mx-auto my-16 text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
        <Compass className="w-10 h-10" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">404 Error</span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
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
