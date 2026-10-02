import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  Home, 
  Search, 
  PlusCircle, 
  Package, 
  MessageSquare, 
  LogIn, 
  UserPlus, 
  Menu, 
  X,
  Sun,
  Moon
} from 'lucide-react';
import Button from './Button';
import { useTheme } from '../hooks/useTheme';

/**
 * Production-quality Navbar for Campus Classifieds.
 * Includes:
 * - Campus Classifieds logo/name
 * - Home, Browse, Sell, My Listings, Messages
 * - Login, Register
 * - Light / Dark Theme Switcher with persistence
 * - Responsive, accessible mobile drawer menu
 * Reusable across all pages with React Router.
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const [prevPathname, setPrevPathname] = useState(location.pathname);

  // Close mobile menu whenever location changes
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileMenuOpen(false);
  }

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home, end: true },
    { name: 'Listings', path: '/listings', icon: Search },
    { name: 'Sell', path: '/sell', icon: PlusCircle },
    { name: 'My Listings', path: '/my-listings', icon: Package },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
  ];

  const getNavLinkClasses = ({ isActive }) => {
    const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150';
    return isActive
      ? `${base} bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs`
      : `${base} text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80`;
  };

  const getMobileNavLinkClasses = ({ isActive }) => {
    const base = 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150';
    return isActive
      ? `${base} bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border-l-3 border-emerald-600`
      : `${base} text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo / Brand Name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg group"
            aria-label="Campus Classifieds Home"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-2xs group-hover:bg-emerald-800 transition-colors">
              <GraduationCap className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                Campus Classifieds
              </span>
              <span className="hidden sm:block text-[10px] font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                Student Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={getNavLinkClasses}
                >
                  <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop Auth Links & Theme Toggle */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" aria-hidden="true" />
              )}
            </button>

            <NavLink
              to="/login"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-slate-900 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
              }
            >
              Login
            </NavLink>

            <Button
              variant="primary"
              size="sm"
              to="/register"
            >
              Register
            </Button>
          </div>

          {/* Mobile Actions & Hamburger Toggle */}
          <div className="flex lg:hidden items-center gap-1.5">
            {/* Mobile Theme Toggle */}
            <button
              type="button"
              id="mobile-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" aria-hidden="true" />
              )}
            </button>

            <Button
              variant="primary"
              size="sm"
              to="/sell"
              className="text-xs px-2.5 py-1.5"
            >
              Sell
            </Button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-5 space-y-3 shadow-xs animate-in slide-in-from-top-1 duration-150"
        >
          <nav aria-label="Mobile Navigation" className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={getMobileNavLinkClasses}
                >
                  <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile Auth CTAs */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="md"
                to="/login"
                leftIcon={LogIn}
                fullWidth
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Button>

              <Button
                variant="primary"
                size="md"
                to="/register"
                leftIcon={UserPlus}
                fullWidth
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
