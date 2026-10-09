import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { Badge } from '../components';

export default function Privacy() {
  useDocumentTitle('Privacy Policy');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Privacy Policy"
        description="How Campus Classifieds protects student information and maintains campus data privacy."
        badge={
          <Badge variant="primary" size="sm" icon={ShieldCheck}>
            Privacy & Trust
          </Badge>
        }
      />

      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] p-6 sm:p-8 shadow-2xs space-y-6 text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#18181B] dark:text-[#FAFAFA]">1. Student Information We Collect</h2>
          <p>
            To verify campus status, we collect your university email address (.edu or approved collegiate domain), student name, and declared department. We do not sell your personal information or distribute it to third-party marketing brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#18181B] dark:text-[#FAFAFA]">2. Visibility to Other Students</h2>
          <p>
            When you post a classified item, other verified students at your institution can view your listing title, description, photos, proposed campus pickup point, and verified student status badge. Your email address remains private unless you choose to share it in direct conversation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#18181B] dark:text-[#FAFAFA]">3. Data Security & Retention</h2>
          <p>
            All messages, session tokens, and student profiles are protected using industry-standard encryption protocols. You have the right to request deletion of your account and archived listings at any time.
          </p>
        </section>

        <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#27272A] text-xs text-[#71717A] dark:text-[#A1A1AA]">
          Last revised: October 2026. For questions regarding student privacy, contact privacy@campusclassifieds.edu.
        </div>
      </div>
    </div>
  );
}
