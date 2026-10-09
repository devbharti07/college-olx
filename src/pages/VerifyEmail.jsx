import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Button, EmailVerificationPrompt } from '../components';

export default function VerifyEmail() {
  useDocumentTitle('Email Verification | Campus Classifieds');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { isVerified, refreshUser, keycloakEmailVerified } = useAuth();
  const [isVerifying, setIsVerifying] = useState(Boolean(token));
  const [verificationResult, setVerificationResult] = useState(null); // { success: boolean, message: string }

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const verifyToken = async () => {
      setIsVerifying(true);
      try {
        const response = await authService.verifyEmail(token);
        if (isMounted) {
          setVerificationResult({
            success: true,
            message: response?.message || 'Institutional college email verified successfully!',
          });
          await refreshUser();
        }
      } catch (err) {
        if (isMounted) {
          setVerificationResult({
            success: false,
            message:
              err?.response?.data?.error?.message ||
              err?.message ||
              'This verification link is invalid or has expired. Please request a new verification link.',
          });
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token, refreshUser]);

  // If a token was provided in the query string, display the token verification outcome:
  if (token) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-sm text-center space-y-6">
        {isVerifying ? (
          <div className="space-y-4 py-8">
            <div className="w-12 h-12 mx-auto border-4 border-[#6366F1] dark:border-[#818CF8] border-t-transparent rounded-full animate-spin" />
            <h2 className="text-xl font-bold text-[#18181B] dark:text-[#FAFAFA]">
              Verifying collegiate credentials...
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Validating your institutional cryptographic token with campus registry.
            </p>
          </div>
        ) : verificationResult?.success ? (
          <div className="space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F0FDF4] dark:bg-[#14532D]/30 border border-[#16A34A]/30 flex items-center justify-center text-[#16A34A] dark:text-[#22C55E]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA]">
                Email Verified!
              </h2>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">
                {verificationResult.message}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <Button variant="primary" to="/sell" rightIcon={ArrowRight}>
                Start Selling on Campus
              </Button>
              <Button variant="outline" to="/listings">
                Browse Marketplace
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#DC2626]/30 flex items-center justify-center text-[#DC2626] dark:text-[#F87171]">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA]">
                Verification Failed
              </h2>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">
                {verificationResult?.message || 'Verification link expired or invalid.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <Button variant="primary" to="/profile">
                Request Fresh Verification Link
              </Button>
              <Button variant="outline" to="/listings">
                Return to Marketplace
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If already verified both Keycloak and college:
  if (keycloakEmailVerified && isVerified) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-[#18181B] rounded-2xl border border-[#16A34A]/30 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F0FDF4] dark:bg-[#14532D]/30 border border-[#16A34A]/30 flex items-center justify-center text-[#16A34A] dark:text-[#22C55E]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA]">
            Account Fully Verified
          </h2>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">
            Both your account email and collegiate enrollment have been verified.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2.5">
          <Button variant="primary" to="/sell" rightIcon={ArrowRight}>
            Post an Item
          </Button>
          <Button variant="outline" to="/listings">
            Browse Campus Listings
          </Button>
        </div>
      </div>
    );
  }

  // Default: show the Keycloak Email Verification Prompt
  return <EmailVerificationPrompt />;
}
