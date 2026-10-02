/**
 * Campus Classifieds Design System Tokens
 * Reusable constants representing design choices for colors, typography,
 * spacing, radii, shadows, buttons, inputs, cards, and badges.
 */

export const DESIGN_TOKENS = {
  colors: {
    brand: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      500: '#10b981',
      600: '#059669', // Main Brand Emerald
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    neutral: {
      50: '#f8fafc',  // Background
      100: '#f1f5f9', // Light surface
      200: '#e2e8f0', // Border subtle
      300: '#cbd5e1', // Border strong
      400: '#94a3b8', // Subtle text / icon
      500: '#64748b', // Muted text
      700: '#334155', // Secondary text
      900: '#0f172a', // Primary heading text
    },
    semantic: {
      success: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
      warning: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
      danger:  { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
      info:    { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
    },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    letterSpacing: {
      tight: '-0.02em',
      tighter: '-0.025em',
    },
  },
  radii: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '0.875rem',   // 14px - standard card radius
    '2xl': '1rem',    // 16px - maximum dialog/card radius
    full: '9999px',
  },
  shadows: {
    subtleXs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
    subtleSm: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
    cardHover: '0 4px 12px -2px rgba(15, 23, 42, 0.07)',
    modal: '0 12px 28px -4px rgba(15, 23, 42, 0.12)',
  },
  spacing: {
    containerMax: '80rem', // max-w-7xl
    pagePaddingX: 'px-4 sm:px-6 lg:px-8',
    cardPadding: 'p-4 sm:p-5',
    sectionGap: 'space-y-10 sm:space-y-12',
  },
};

export default DESIGN_TOKENS;
