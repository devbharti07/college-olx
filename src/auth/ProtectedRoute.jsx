import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from './useAuth';
import { Button, EmailVerificationPrompt } from '../components';

/**
 * Route protection wrapper enforcing:
 * 1. Keycloak authentication session
 * 2. Keycloak email verification (Tier 1 - account ownership)
 * 3. Institutional collegiate email verification (Tier 2 - student status)
 * 4. Administrator role authorization
 */
export function ProtectedRoute({
  children,
  requireVerified = false,
  requireAdmin = false,
  requireEmailVerified = false, // explicit check (implied by requireVerified)
}) {
  const { 
    isAuthenticated, 
    keycloakEmailVerified, 
    isVerified, 
    isAdmin, 
    isLoading, 
    isOffline, 
    authError, 
    retryInit 
  } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-[#6366F1] dark:border-[#818CF8] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#71717A] dark:text-[#A1A1AA]">
          Initializing secure login...
        </p>
      </div>
    );
  }

  // 1. Not authenticated
  if (!isAuthenticated) {
    if (isOffline || authError) {
      return (
        <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#18181B] dark:text-[#FAFAFA] mb-2">
            Authentication service unavailable
          </h2>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-6">
            The Keycloak authentication provider is currently unavailable. Please verify the authentication service is running to sign in.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="primary" onClick={() => (retryInit ? retryInit() : window.location.reload())}>
              Retry
            </Button>
            <Button variant="outline" to="/listings">
              Browse Public Listings
            </Button>
          </div>
        </div>
      );
    }

    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // 2. Admin authorization check
  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-[#DC2626] dark:text-[#F87171]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#18181B] dark:text-[#FAFAFA] mb-2">
          Administrator Access Required
        </h2>
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-6">
          Your student account does not have permission to view this administration area. Contact campus moderation if you believe this is an error.
        </p>
        <Button variant="primary" to="/listings">
          Return to Marketplace
        </Button>
      </div>
    );
  }

  // 3. Keycloak Email Verification Check (Tier 1)
  // Must verify account email before accessing sell, my-listings, messages, or reports
  const needsEmailVerification = requireEmailVerified || requireVerified;
  if (needsEmailVerification && keycloakEmailVerified === false) {
    return (
      <EmailVerificationPrompt
        title="Verify your email"
        featureNotice="Please verify your email before using this feature."
        showFeatureNotice={true}
      />
    );
  }

  // 4. Institutional College Verification Check (Tier 2)
  if (requireVerified && !isVerified) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#EEF2FF] dark:bg-[#312E81]/40 flex items-center justify-center text-[#6366F1] dark:text-[#818CF8]">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#18181B] dark:text-[#FAFAFA] mb-2">
          Institutional Verification Required
        </h2>
        <p className="text-sm font-semibold text-[#4F46E5] dark:text-[#A5B4FC] bg-[#EEF2FF] dark:bg-[#312E81]/30 py-1.5 px-3 rounded-lg border border-[#C7D2FE]/60 dark:border-[#4338CA]/60 inline-block mb-3">
          Your email is verified, but your college account still needs verification.
        </p>
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-6 leading-relaxed">
          Campus Classifieds is a secure, college-only marketplace. You must verify your approved institutional email address (<code className="font-semibold text-[#6366F1] dark:text-[#818CF8]">.edu, .edu.in, .ac.in</code>) before creating listings, contacting sellers, or sending messages.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" to="/profile" leftIcon={ShieldCheck}>
            Verify College Email in Profile
          </Button>
          <Button variant="outline" to="/listings">
            Browse Listings
          </Button>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
