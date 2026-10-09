import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft 
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { Button } from '../components';
import apiClient from '../services/apiClient';

export default function Report() {
  useDocumentTitle('Report Campus Infraction | Campus Classifieds');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listingId') || '';

  const [reason, setReason] = useState('Inappropriate or prohibited item');
  const [description, setDescription] = useState('');
  const [targetListingId, setTargetListingId] = useState(listingId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setFeedback({ type: 'error', message: 'Please provide details explaining the infraction.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await apiClient.post('/reports', {
        reason,
        description: description.trim(),
        listingId: targetListingId.trim() || undefined,
      });
      setFeedback({
        type: 'success',
        message: 'Your report has been submitted to campus administration for review.',
      });
      setDescription('');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.error?.message || err?.message || 'Failed to submit report.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-0 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        leftIcon={ArrowLeft}
        className="w-fit"
      >
        Back
      </Button>

      <PageHeader
        title="Submit Safety Report"
        description="Help maintain a safe and trusted student marketplace by reporting policy violations."
      />

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] dark:bg-[#14532D]/30 text-[#16A34A] dark:text-[#22C55E] border-[#16A34A]/30'
              : 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 text-[#DC2626] dark:text-[#F87171] border-[#DC2626]/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#16A34A] dark:text-[#22C55E] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#DC2626] dark:text-[#F87171] shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
            Infraction Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-sm text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#6366F1] dark:focus:ring-[#818CF8]"
          >
            <option value="Inappropriate or prohibited item">Inappropriate or prohibited item</option>
            <option value="Suspected counterfeit or scam">Suspected counterfeit or scam</option>
            <option value="Misleading description or condition">Misleading description or condition</option>
            <option value="Off-campus commercial seller">Off-campus commercial seller</option>
            <option value="Harassment or inappropriate communication">Harassment or inappropriate communication</option>
            <option value="Other campus policy violation">Other campus policy violation</option>
          </select>
        </div>

        {targetListingId && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
              Related Listing Identifier
            </label>
            <input
              type="text"
              value={targetListingId}
              onChange={(e) => setTargetListingId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#27272A] text-sm text-[#71717A] dark:text-[#A1A1AA]"
              readOnly
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
            Detailed Description <span className="text-[#DC2626] dark:text-[#F87171]">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please describe what occurred or why this violates campus policy..."
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-sm text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#6366F1] dark:focus:ring-[#818CF8] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isSubmitting}
            leftIcon={Send}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </div>
  );
}
