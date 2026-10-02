import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  CreditCard, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Server
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { authService } from '../services/authService';
import { Input, Button, Badge } from '../components';

export default function Register() {
  useDocumentTitle('Student Registration');

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    collegeId: '',
    password: '',
    confirmPassword: '',
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation error states
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    collegeId: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });

  // UI simulation states
  const [isLoading, setIsLoading] = useState(false);
  const [formValidated, setFormValidated] = useState(null);

  // Email format regex
  const isValidEmail = (emailStr) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailStr.trim());
  };

  // Password strength calculator
  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700', width: 'w-0' };

    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { score: 1, label: 'Weak', color: 'bg-rose-500', width: 'w-1/3' };
    } else if (score <= 3) {
      return { score: 2, label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
    } else {
      return { score: 3, label: 'Strong', color: 'bg-emerald-600', width: 'w-full' };
    }
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fullName: '',
      email: '',
      collegeId: '',
      password: '',
      confirmPassword: '',
      terms: '',
    };

    // Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
      isValid = false;
    }

    // College Email
    if (!formData.email.trim()) {
      newErrors.email = 'College email address is required.';
      isValid = false;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid university email (e.g. name@campus.edu).';
      isValid = false;
    }

    // College ID
    if (!formData.collegeId.trim()) {
      newErrors.collegeId = 'College ID / Student Roll Number is required.';
      isValid = false;
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
      isValid = false;
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
      isValid = false;
    }

    // Terms & Conditions
    if (!termsAccepted) {
      newErrors.terms = 'You must agree to the Campus Classifieds community terms.';
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
      const res = await authService.register(formData);
      setFormValidated(res);
    } catch (err) {
      setErrors((prev) => ({ ...prev, email: err?.message || 'Registration error.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-12 px-4 sm:px-0">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Brand & Page Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shadow-2xs">
            <GraduationCap className="w-6 h-6" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Create Student Account
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Join the verified peer exchange for your college campus.
          </p>
        </div>

        {/* Security & Verification Callout */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Campus verified registration. Use your official student roll number and university email.
          </span>
        </div>

        {/* Honest Validation Confirmation Status */}
        {formValidated && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-xs text-slate-700 dark:text-slate-300 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-slate-100">Registration Validated</span>
              </div>
              <Badge variant="primary" size="sm" icon={Server}>
                Frontend Preview
              </Badge>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Student information for <strong className="text-slate-700 dark:text-slate-200">{formData.fullName}</strong> ({formData.email}) is formatted correctly. Real account creation and college verification will proceed when the user database is connected.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                to="/login"
              >
                Sign In UI
              </Button>
              <Button
                variant="primary"
                size="sm"
                to="/listings"
                rightIcon={ArrowRight}
              >
                Browse Listings
              </Button>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* 1. Full Name */}
          <Input
            id="register-fullname"
            name="fullName"
            type="text"
            label="Full Name"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Alex Johnson"
            leftIcon={User}
            error={errors.fullName}
            autoComplete="name"
          />

          {/* 2. College Email */}
          <Input
            id="register-email"
            name="email"
            type="email"
            label="College Email (.edu)"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="alex.johnson@campus.edu"
            leftIcon={Mail}
            error={errors.email}
            helperText={!errors.email ? 'Must be an official collegiate or university address' : undefined}
            autoComplete="email"
          />

          {/* 3. College ID */}
          <Input
            id="register-college-id"
            name="collegeId"
            type="text"
            label="College ID / Student Roll Number"
            required
            value={formData.collegeId}
            onChange={handleChange}
            placeholder="e.g. STU-2024-8921"
            leftIcon={CreditCard}
            error={errors.collegeId}
            helperText={!errors.collegeId ? 'Used to verify student enrollment' : undefined}
          />

          {/* 4. Password with Strength Indicator */}
          <div className="space-y-1.5">
            <Input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Create strong password"
              leftIcon={Lock}
              error={errors.password}
              autoComplete="new-password"
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

            {/* Real-time Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Password strength:</span>
                  <span className={`font-semibold ${
                    passwordStrength.label === 'Strong' ? 'text-emerald-700 dark:text-emerald-400' :
                    passwordStrength.label === 'Medium' ? 'text-amber-700 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-200`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Confirm Password */}
          <Input
            id="register-confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            leftIcon={KeyRound}
            error={errors.confirmPassword}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            }
          />

          {/* 6. Terms Checkbox */}
          <div className="space-y-1 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                id="terms-accepted"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }));
                }}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="leading-snug">
                I agree to the{' '}
                <Link to="/terms" className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium">
                  Privacy Policy
                </Link>
                , and confirm I am an enrolled student.
              </span>
            </label>

            {errors.terms && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.terms}</span>
              </p>
            )}
          </div>

          {/* Submit Action */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            rightIcon={ArrowRight}
            className="mt-2"
          >
            {isLoading ? 'Validating Registration...' : 'Create Account'}
          </Button>
        </form>

        {/* Link to Login */}
        <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
