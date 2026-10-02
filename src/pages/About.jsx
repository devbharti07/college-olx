import React from 'react';
import { ShieldCheck, Users, RefreshCw } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { Badge, Button } from '../components';

export default function About() {
  useDocumentTitle('About Us');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="About Campus Classifieds"
        description="The college-only marketplace built to make campus essentials affordable and accessible."
        badge={
          <Badge variant="primary" size="sm" icon={ShieldCheck}>
            Our Mission
          </Badge>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Built for Students, by Students</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Every semester, university students spend thousands of rupees on engineering drafters, lab equipment, thick textbooks, and lab coats that are only used for a few months. Meanwhile, senior students have those exact items gathering dust in their dorm rooms.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Campus Classifieds bridges that gap. We provide a verified, campus-exclusive platform where peers can safely buy, sell, donate, or exchange academic essentials without expensive retail markups or shipping fees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Verified Accounts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Only verified students with valid university email domains are admitted.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Sustainable Cycling</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keeps textbooks, coats, and drawing boards in circulation across batches.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Peer-to-Peer</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Meet directly at campus landmarks like libraries and student cafeterias.</p>
          </div>
        </div>

        <div className="pt-4 flex justify-start gap-3">
          <Button variant="primary" size="md" to="/listings">
            Explore Listings
          </Button>
          <Button variant="outline" size="md" to="/contact">
            Contact Team
          </Button>
        </div>
      </div>
    </div>
  );
}
