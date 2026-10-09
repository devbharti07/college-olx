import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  GraduationCap, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Info,
  Mail,
  Lock,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components';

export default function Login() {
  useDocumentTitle('Student Sign In | Campus Marketplace');
  const [searchParams] = useSearchParams();
  const { login, resetPassword, isOffline, authError: initAuthError, retryInit } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [googleNotice, setGoogleNotice] = useState(false);

  const redirectPath = searchParams.get('redirect') || '/listings';
  const redirectUri = window.location.origin + redirectPath;

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    setGoogleNotice(false);

    try {
      const loginOptions = { redirectUri };
      if (email && email.trim()) {
        loginOptions.loginHint = email.trim().toLowerCase();
      }
      await login(loginOptions);
    } catch (err) {
      console.error('Keycloak login error:', err);
      setAuthError(err?.message || 'Unable to redirect to authentication provider. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      resetPassword({ redirectUri });
    } catch (err) {
      console.error('Keycloak password reset error:', err);
      setAuthError('Unable to route to password recovery. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    setGoogleNotice(false);
    try {
      await login({ idpHint: 'google', redirectUri });
    } catch (err) {
      console.error('Keycloak Google login error:', err);
      setGoogleNotice(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-14 px-4 sm:px-0">
      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Brand & Page Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#EEF2FF] dark:bg-[#312E81]/40 text-[#6366F1] dark:text-[#818CF8] border border-[#6366F1]/20 dark:border-[#818CF8]/30 flex items-center justify-center shadow-2xs">
            <GraduationCap className="w-6 h-6" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
            Sign In to Campus Classifieds
          </h1>

          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-xs mx-auto leading-relaxed">
            Trade textbooks, electronics, cycles, and supplies safely with students at your campus.
          </p>
        </div>

        {/* Offline / Unavailable Warning */}
        {(isOffline || initAuthError) && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Authentication service unavailable</p>
                <p className="text-[11px] leading-relaxed">
                  The Keycloak authentication provider is currently unavailable. Please verify Docker services are running to sign in.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => (retryInit ? retryInit() : window.location.reload())}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {authError && (
          <div className="p-3.5 bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#DC2626]/30 rounded-xl text-xs text-[#DC2626] dark:text-[#F87171] flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#DC2626] dark:text-[#F87171] shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Google IDP Configuration Notice */}
        {googleNotice && (
          <div className="p-3.5 bg-[#EEF2FF] dark:bg-[#312E81]/30 border border-[#6366F1]/30 rounded-xl text-xs text-[#4F46E5] dark:text-[#A5B4FC] space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <HelpCircle className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
              <span>Google SSO Setup Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              "Continue with Google" requires Google OAuth Client ID credentials to be configured in the Keycloak admin console.
            </p>
            <p className="text-[11px] font-medium leading-relaxed text-[#4F46E5] dark:text-[#A5B4FC]">
              💡 You can register and log in directly using your normal Gmail address and password below!
            </p>
          </div>
        )}

        {/* Main Authentication Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5 text-left">
            <label 
              htmlFor="login-email" 
              className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@gmail.com, outlook.com, or college.edu"
                autoComplete="email"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8] transition-colors"
              />
            </div>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
              Supports Gmail, Yahoo, Outlook, and college institutional domains.
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="login-password" 
                className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] text-[#6366F1] dark:text-[#818CF8] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] font-medium focus:outline-none cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2 text-sm bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Keycloak SSO Security Assurance */}
          <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#27272A]/60 border border-[#E4E4E7] dark:border-[#27272A] text-[11px] text-[#71717A] dark:text-[#A1A1AA] flex items-start gap-2 text-left">
            <ShieldCheck className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E] shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Single Sign-On Security:</strong> Authentication is handled by Keycloak with PKCE S256. Passwords are never collected or stored in application databases.
            </span>
          </div>

          {/* Login Action Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center shadow-xs cursor-pointer"
            disabled={isLoading || isOffline}
            rightIcon={ArrowRight}
          >
            {isLoading ? 'Connecting to Keycloak...' : 'Login with Keycloak'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E4E4E7] dark:border-[#27272A] w-full" />
          <span className="bg-white dark:bg-[#18181B] px-3 text-[11px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider shrink-0 font-medium">
            or
          </span>
        </div>

        {/* Optional Google Login */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-center cursor-pointer"
          onClick={handleGoogleLogin}
          disabled={isLoading || isOffline}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Footer info & Links */}
        <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#27272A] text-center space-y-2">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Don't have an account yet?{' '}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirectPath)}`}
              className="text-[#6366F1] dark:text-[#818CF8] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] font-semibold focus:outline-none focus:underline"
            >
              Create Account
            </Link>
          </p>

          <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
            Forgot your password? Click{' '}
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[#6366F1] dark:text-[#818CF8] hover:underline font-medium cursor-pointer"
            >
              Forgot Password
            </button>{' '}
            for Keycloak self-service password recovery.
          </p>
        </div>
      </div>
    </div>
  );
}
