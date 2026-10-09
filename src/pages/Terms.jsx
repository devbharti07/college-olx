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

      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] p-6 sm:p-8 shadow-2xs space-y-6 text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#18181B] dark:text-[#FAFAFA]">1. Eligibility & Student Verification</h2>
          <p>
            Campus Classifieds is strictly reserved for active students, faculty, and university affiliates. Commercial retailers, unauthorized distributors, and non-student third parties are prohibited from operating seller accounts.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#18181B] dark:text-[#FAFAFA]">2. Prohibited Items</h2>
          <p>
            Prohibited listings include unauthorized solution manuals, stolen property, illegal substances, weapons, alcohol, prescription medications, or items violating university academic integrity and laboratory safety codes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#18181B] dark:text-[#FAFAFA]">3. Campus Meetups & Exchanges</h2>
          <p>
            Transactions are conducted peer-to-peer. Students are strongly advised to arrange exchanges in public, well-lit university locations such as library foyers, student center lounges, or campus cafeterias during operating hours.
          </p>
        </section>

        <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#27272A] text-xs text-[#71717A] dark:text-[#A1A1AA]">
          Last updated: October 2026. Violations may result in account termination and report to campus administration.
        </div>
      </div>
    </div>
  );
}
