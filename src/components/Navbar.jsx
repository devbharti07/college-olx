import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Moon,
  LogOut,
  User,
  ShieldCheck,
  Compass
} from 'lucide-react';
import Button from './Button';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

/**
 * Production-quality Navbar for Campus Classifieds.
 * Includes:
 * - Campus Classifieds logo/name
 * - Home, Listings, Sell, My Listings, Messages
 * - Dynamic Login/Register or User Profile/Logout state
 * - Light / Dark Theme Switcher with persistence
 * - Responsive, accessible mobile drawer menu
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home, end: true },
    { name: 'About', path: '/landing', icon: Compass },
    { name: 'Listings', path: '/listings', icon: Search },
    { name: 'Sell', path: '/sell', icon: PlusCircle },
    { name: 'My Listings', path: '/my-listings', icon: Package },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
  ];

  const getNavLinkClasses = ({ isActive }) => {
    const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150';
    return isActive
      ? `${base} bg-[#EEF2FF] dark:bg-[#312E81]/30 text-[#4F46E5] dark:text-[#A5B4FC] font-semibold shadow-2xs`
      : `${base} text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]`;
  };

  const getMobileNavLinkClasses = ({ isActive }) => {
    const base = 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150';
    return isActive
      ? `${base} bg-[#EEF2FF] dark:bg-[#312E81]/30 text-[#4F46E5] dark:text-[#A5B4FC] font-semibold border-l-3 border-[#6366F1] dark:border-[#818CF8]`
      : `${base} text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#18181B] border-b border-[#E4E4E7] dark:border-[#27272A] shadow-2xs transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo / Brand Name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] rounded-lg group"
            aria-label="Campus Classifieds Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] flex items-center justify-center shadow-2xs group-hover:bg-[#4F46E5] dark:group-hover:bg-[#A5B4FC] transition-colors">
              <GraduationCap className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#18181B] dark:text-[#FAFAFA] leading-tight">
                Campus Classifieds
              </span>
              <span className="hidden sm:block text-[10px] font-semibold tracking-wider uppercase text-[#71717A] dark:text-[#A1A1AA]">
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
                  <Icon className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0" aria-hidden="true" />
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
              className="p-2 rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] cursor-pointer"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#FAFAFA]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-[#71717A]" aria-hidden="true" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#FAFAFA] dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] hover:border-[#6366F1] dark:hover:border-[#818CF8] transition-colors text-xs text-[#18181B] dark:text-[#FAFAFA]"
                >
                  <div className="w-6 h-6 rounded-full bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] flex items-center justify-center font-bold text-[10px]">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="font-semibold max-w-[100px] truncate">{user?.name || 'Profile'}</span>
                  {user?.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#22C55E]" />
                  )}
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={LogOut}
                  className="text-xs text-[#71717A] hover:text-[#DC2626] dark:hover:text-[#F87171]"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile Actions & Hamburger Toggle */}
          <div className="flex lg:hidden items-center gap-1.5">
            {/* Mobile Theme Toggle */}
            <button
              type="button"
              id="mobile-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] focus:outline-none cursor-pointer"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-[#71717A]" aria-hidden="true" />
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
              className="p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] transition-colors"
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
          className="lg:hidden border-b border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] px-4 pt-2 pb-5 space-y-3 shadow-xs animate-slide-down"
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
                  <Icon className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <NavLink
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={getMobileNavLinkClasses}
            >
              <User className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0" />
              <span>Profile</span>
            </NavLink>
          </nav>

          {/* Mobile Auth CTAs */}
          <div className="pt-3 border-t border-[#E4E4E7] dark:border-[#27272A] space-y-2">
            {isAuthenticated ? (
              <div className="flex items-center justify-between gap-2 p-2 bg-[#FAFAFA] dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#27272A]">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-7 h-7 rounded-full bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-[#18181B] dark:text-[#FAFAFA]">{user?.name}</div>
                    <div className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{user?.college || 'Student'}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  leftIcon={LogOut}
                  className="text-xs text-[#DC2626] dark:text-[#F87171] hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D]/30"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </header>
  );
}
