import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  GraduationCap, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Info,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components';

export default function Register() {
  useDocumentTitle('Create Student Account | Campus Marketplace');
  const [searchParams] = useSearchParams();
  const { register, isOffline, authError: initAuthError, retryInit } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [college, setCollege] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const redirectPath = searchParams.get('redirect') || '/listings';
  const redirectUri = window.location.origin + redirectPath;

  const handleRegisterSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormError(null);

    // Validation
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (password && password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const regOptions = { redirectUri };
      if (trimmedEmail) {
        regOptions.loginHint = trimmedEmail;
      }
      await register(regOptions);
    } catch (err) {
      console.error('Keycloak registration error:', err);
      setFormError(err?.message || 'Unable to redirect to registration provider. Please try again.');
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
            Create Student Account
          </h1>

          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-xs mx-auto leading-relaxed">
            Join the verified campus community to trade textbooks, electronics, cycles, and supplies safely.
          </p>
        </div>

        {/* Two-Tier Verification Policy Notice */}
        <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#27272A]/80 border border-[#E4E4E7] dark:border-[#27272A] space-y-2 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
            <ShieldCheck className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E] shrink-0" />
            <span>Campus Registration & Verification</span>
          </div>
          <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            You can register using any normal email (<code className="font-semibold text-[#6366F1] dark:text-[#818CF8]">@gmail.com, @outlook.com, @yahoo.com</code>) or institutional email.
          </p>
          <ul className="space-y-1 text-[11px] text-[#71717A] dark:text-[#A1A1AA] list-disc list-inside">
            <li><strong>Keycloak Email Verification:</strong> Confirms your account identity.</li>
            <li><strong>Collegiate Verification:</strong> Separate step for .edu / .ac.in institutional badges.</li>
          </ul>
        </div>

        {/* Offline / Unavailable Warning */}
        {(isOffline || initAuthError) && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Authentication service unavailable</p>
                <p className="text-[11px] leading-relaxed">
                  The Keycloak authentication provider is currently unavailable. Please verify Docker services are running to register.
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
        {formError && (
          <div className="p-3.5 bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#DC2626]/30 rounded-xl text-xs text-[#DC2626] dark:text-[#F87171] flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#DC2626] dark:text-[#F87171] shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1 text-left">
            <label 
              htmlFor="reg-name" 
              className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]"
            >
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A] dark:text-[#A1A1AA]">
                <User className="w-4 h-4" />
              </div>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8] transition-colors"
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1 text-left">
            <label 
              htmlFor="reg-email" 
              className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@gmail.com, yahoo.com, outlook.com, or .edu"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8] transition-colors"
                required
              />
            </div>
            <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
              Personal emails (Gmail, Outlook, Yahoo) are fully accepted.
            </p>
          </div>

          {/* Password */}
          <div className="space-y-1 text-left">
            <label 
              htmlFor="reg-password" 
              className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
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

          {/* Confirm Password */}
          <div className="space-y-1 text-left">
            <label 
              htmlFor="reg-confirm-password" 
              className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                minLength={8}
                className="w-full pl-9 pr-10 py-2 text-sm bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Optional: College / University */}
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="reg-college" 
                className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]"
              >
                College / University
              </label>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-medium">Optional</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
                <Building className="w-4 h-4" />
              </div>
              <input
                id="reg-college"
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. Stanford University / IIT Delhi"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8] transition-colors"
              />
            </div>
          </div>

          {/* Submit Action */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center shadow-xs cursor-pointer pt-1"
            disabled={isLoading || isOffline}
            rightIcon={ArrowRight}
          >
            {isLoading ? 'Connecting to Keycloak...' : 'Create Account with Keycloak'}
          </Button>
        </form>

        {/* Footer info & Links */}
        <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#27272A] text-center">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Already have an account?{' '}
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
              className="text-[#6366F1] dark:text-[#818CF8] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] font-semibold focus:outline-none focus:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
