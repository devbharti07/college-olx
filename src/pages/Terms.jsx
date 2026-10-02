import React from 'react';
import { Scale } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { Badge } from '../components';

export default function Terms() {
  useDocumentTitle('Terms of Service');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Terms of Service"
        description="Community standards, code of conduct, and rules for trading on Campus Classifieds."
        badge={
          <Badge variant="secondary" size="sm" icon={Scale}>
            Campus Agreement
          </Badge>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">1. Eligibility & Student Verification</h2>
          <p>
            Campus Classifieds is strictly reserved for active students, faculty, and university affiliates. Commercial retailers, unauthorized distributors, and non-student third parties are prohibited from operating seller accounts.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">2. Prohibited Items</h2>
          <p>
            Prohibited listings include unauthorized solution manuals, stolen property, illegal substances, weapons, alcohol, prescription medications, or items violating university academic integrity and laboratory safety codes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">3. Campus Meetups & Exchanges</h2>
          <p>
            Transactions are conducted peer-to-peer. Students are strongly advised to arrange exchanges in public, well-lit university locations such as library foyers, student center lounges, or campus cafeterias during operating hours.
          </p>
        </section>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
          Last updated: October 2026. Violations may result in account termination and report to campus administration.
        </div>
      </div>
    </div>
  );
}
