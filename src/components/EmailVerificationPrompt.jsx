import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  RefreshCw, 
  Send, 
  ExternalLink, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Inbox
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/apiClient';
import Button from './Button';

/**
 * Safely mask an email address for privacy (e.g. j***n@college.edu)
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '';
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
}

export default function EmailVerificationPrompt({
  title = 'Verify your email',
  featureNotice = 'Please verify your email before using this feature.',
  showFeatureNotice = false,
  onVerified,
}) {
  const { user, refreshEmailVerification, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', message: string }

  const maskedEmail = user?.email ? maskEmail(user.email) : '';
  const isLocalDev = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setFeedback(null);
    try {
      const res = await refreshEmailVerification();
      if (res?.verified) {
        setFeedback({
          type: 'success',
          message: 'Your email address has been verified! Redirecting...',
        });
        if (typeof onVerified === 'function') {
          onVerified();
        } else {
          // Slight delay to allow state propagation
          setTimeout(() => {
            window.location.reload();
          }, 800);
        }
      } else {
        setFeedback({
          type: 'info',
          message: 'Email is not verified yet. Please check your inbox and click the verification link.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Unable to check verification status right now.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    setFeedback(null);
    try {
      const res = await apiClient.post('/auth/resend-verification', { type: 'keycloak' });
      if (res?.alreadyVerified) {
        setFeedback({
          type: 'success',
          message: 'Your account email is already verified! Refreshing...',
        });
        await refreshEmailVerification();
      } else {
        setFeedback({
          type: 'success',
          message: res?.message || 'A new verification email has been dispatched. Check your inbox.',
        });
        setCooldown(60); // 60s cooldown
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to resend verification email. Please try again later.';
      setFeedback({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setIsResending(false);
    }
  };

  const emailDomain = (user?.email || '').split('@')[1]?.toLowerCase() || '';
  const isGmail = emailDomain === 'gmail.com' || emailDomain === 'googlemail.com';
  const isOutlook = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(emailDomain);
  const isYahoo = ['yahoo.com', 'yahoo.co.in'].includes(emailDomain);

  return (
    <div className="max-w-lg mx-auto my-10 p-6 sm:p-8 bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-sm text-center space-y-6 animate-in fade-in duration-200">
      {/* Visual Badge Icon */}
      <div className="relative w-16 h-16 mx-auto rounded-2xl bg-[#6366F1]/10 dark:bg-[#818CF8]/10 border border-[#6366F1]/20 dark:border-[#818CF8]/20 flex items-center justify-center text-[#6366F1] dark:text-[#818CF8]">
        <Mail className="w-8 h-8" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#16A34A]"></span>
        </span>
      </div>

      {/* Heading & Subtext */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
          {title}
        </h2>

        {showFeatureNotice && (
          <p className="text-sm font-semibold text-[#6366F1] dark:text-[#818CF8] bg-[#6366F1]/10 dark:bg-[#818CF8]/10 py-1.5 px-3 rounded-lg border border-[#6366F1]/20 dark:border-[#818CF8]/20 inline-block">
            {featureNotice}
          </p>
        )}

        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-sm mx-auto leading-relaxed">
          We sent a verification link to your email address
          {maskedEmail && (
            <span className="font-semibold text-[#18181B] dark:text-[#FAFAFA] block mt-1">
              ({maskedEmail})
            </span>
          )}
          . Please check your inbox and click the verification link to confirm your account.
        </p>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 text-left border ${
            feedback.type === 'success'
              ? 'bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E] border-[#16A34A]/20'
              : feedback.type === 'error'
              ? 'bg-[#DC2626]/10 text-[#DC2626] dark:text-[#F87171] border-[#DC2626]/20'
              : 'bg-[#6366F1]/10 text-[#6366F1] dark:text-[#818CF8] border-[#6366F1]/20'
          }`}
        >
          {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A] dark:text-[#22C55E]" />}
          {feedback.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626] dark:text-[#F87171]" />}
          {feedback.type === 'info' && <AlertCircle className="w-4 h-4 shrink-0 text-[#6366F1] dark:text-[#818CF8]" />}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-2">
        {/* Real Inbox Quick Launch Buttons */}
        {isGmail && (
          <a
            href="https://mail.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Open Gmail</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        )}

        {isOutlook && (
          <a
            href="https://outlook.live.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Open Outlook</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        )}

        {isYahoo && (
          <a
            href="https://mail.yahoo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Open Yahoo Mail</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        )}

        {/* Local Development Mailpit Shortcut */}
        {isLocalDev && (
          <a
            href="http://localhost:8025"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[#6366F1] hover:bg-[#4F46E5] text-white transition-colors shadow-2xs cursor-pointer"
          >
            <Inbox className="w-4 h-4" />
            <span>Open Mailbox (Mailpit Dev)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Check Status Action */}
          <Button
            variant={isLocalDev ? 'outline' : 'primary'}
            onClick={handleCheckStatus}
            isLoading={isChecking}
            leftIcon={RefreshCw}
            className="w-full justify-center"
          >
            Check Verification Status
          </Button>

          {/* Resend Action */}
          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={isResending || cooldown > 0}
            isLoading={isResending}
            leftIcon={Send}
            className="w-full justify-center"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}
          </Button>
        </div>

        {/* Logout Action */}
        <div className="pt-2 border-t border-[#E4E4E7] dark:border-[#27272A]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            leftIcon={LogOut}
            className="text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA]"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
