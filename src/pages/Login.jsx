import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2,
  KeyRound,
  Server
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { authService } from '../services/authService';
import { Input, Button, Modal, Badge } from '../components';

export default function Login() {
  useDocumentTitle('Student Sign In');

  // Form field states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation error states
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [formValidated, setFormValidated] = useState(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Email format regex validation
  const isValidEmail = (emailStr) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailStr.trim());
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
      isValid = false;
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid university email (e.g. student@campus.edu).';
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setFormValidated(null);

    try {
      const res = await authService.login({ email, password, rememberMe });
      setFormValidated(res);
    } catch (err) {
      setErrors((prev) => ({ ...prev, password: err?.message || 'Authentication error.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !isValidEmail(forgotEmail)) {
      setForgotError('Please enter a valid student email address.');
      return;
    }
    setForgotError('');
    setForgotSent(true);

    await authService.requestPasswordReset(forgotEmail);
    setTimeout(() => {
      setForgotSent(false);
      setForgotModalOpen(false);
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-14 px-4 sm:px-0">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Brand & Page Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shadow-2xs">
            <GraduationCap className="w-6 h-6" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Student Sign In
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Sign in to buy, sell, or exchange items with verified students at your campus.
          </p>
        </div>

        {/* Security & Student Notice */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Campus-exclusive network. Only students with valid university credentials can trade.
          </span>
        </div>

        {/* Honest Validation Status Feedback */}
        {formValidated && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-slate-100">Client Form Validated</span>
              </div>
              <Badge variant="primary" size="sm" icon={Server}>
                Frontend Only
              </Badge>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Credentials for <strong className="text-slate-700 dark:text-slate-200">{email}</strong> passed client validation. To create real active sessions, connect the backend API service.
            </p>
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                to="/listings"
                rightIcon={ArrowRight}
                className="w-full justify-center"
              >
                Browse Marketplace Listings
              </Button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email field */}
          <Input
            id="login-email"
            name="email"
            type="email"
            label="Campus Email Address"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="student@campus.edu"
            leftIcon={Mail}
            error={errors.email}
            helperText={!errors.email ? 'Use your official college or university email' : undefined}
            autoComplete="email"
          />

          {/* Password field with show/hide toggle */}
          <div className="space-y-1.5">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder="••••••••"
              leftIcon={Lock}
              error={errors.password}
              autoComplete="current-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              }
            />
          </div>

          {/* Remember me & Forgot Password Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="font-medium">Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setForgotModalOpen(true);
              }}
              className="font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline cursor-pointer focus:outline-none focus-visible:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            rightIcon={ArrowRight}
            className="mt-2"
          >
            {isLoading ? 'Validating...' : 'Sign In'}
          </Button>
        </form>

        {/* Link to Register */}
        <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Don't have a campus account?{' '}
            <Link
              to="/register"
              className="font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal (UI Simulation) */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Password"
        description="We'll send password recovery instructions to your verified student email."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setForgotModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleForgotSubmit}
              leftIcon={KeyRound}
              loading={forgotSent}
            >
              {forgotSent ? 'Request Submitted' : 'Send Reset Link'}
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          {forgotSent ? (
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>
                Reset request formatted for <strong>{forgotEmail}</strong>. In production, an email will be dispatched.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Enter your registered college email address below:
              </p>
              <Input
                label="University Email"
                name="forgotEmail"
                type="email"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  if (forgotError) setForgotError('');
                }}
                placeholder="student@campus.edu"
                leftIcon={Mail}
                error={forgotError}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
