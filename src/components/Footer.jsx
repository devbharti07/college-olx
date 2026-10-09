import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import Badge from './Badge';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Production-quality Footer for Campus Classifieds.
 * Includes:
 * - Campus Classifieds logo & name
 * - Short description
 * - Browse, Sell an Item, My Listings, Profile
 * - About, Contact
 * - Privacy, Terms, Admin
 * - Copyright
 * Reusable across all pages with React Router.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] transition-colors duration-150" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand & Short Description */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] rounded-lg group"
              aria-label="Campus Classifieds Home"
            >
              <div className="w-8 h-8 rounded-lg bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] flex items-center justify-center shadow-2xs group-hover:bg-[#4F46E5] dark:group-hover:bg-[#A5B4FC] transition-colors">
                <GraduationCap className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight text-lg">
                Campus Classifieds
              </span>
            </Link>

            <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-sm leading-relaxed">
              Campus Classifieds is the trusted peer-to-peer Indian college marketplace where students buy, sell, and exchange used textbooks, lab equipment, engineering drafters, and essentials safely on campus in Indian Rupees (₹).
            </p>

            <div className="pt-1">
              <Badge variant="primary" size="sm" icon={ShieldCheck}>
                Verified University Network
              </Badge>
            </div>
          </div>

          {/* Column: Marketplace */}
          <nav aria-label="Marketplace Navigation" className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              Marketplace
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/listings"
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:underline transition-colors"
                >
                  Listings
                </Link>
              </li>
              <li>
                <Link
                  to="/sell"
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:underline transition-colors"
                >
                  Sell an Item
                </Link>
              </li>
              <li>
                <Link
                  to="/my-listings"
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:underline transition-colors"
                >
                  My Listings
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:underline transition-colors"
                >
                  Student Profile
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column: About & Support */}
          <nav aria-label="About & Contact Navigation" className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              Information
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:underline transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:underline transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column: Legal & Terms */}
          <nav aria-label="Legal Navigation" className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              Legal & Trust
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:underline transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:underline transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:underline transition-colors"
                >
                  Admin Portal
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="mt-10 pt-6 border-t border-[#E4E4E7] dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between text-xs text-[#71717A] dark:text-[#A1A1AA] gap-3">
          <p>© {CURRENT_YEAR} Campus Classifieds. All prices in INR (₹).</p>
          <p className="text-[#71717A]/80 dark:text-[#A1A1AA]/80">
            Dedicated student peer marketplace
          </p>
        </div>
      </div>
    </footer>
  );
}
