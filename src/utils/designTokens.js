/**
 * Campus Classifieds Design System Tokens
 * Reusable constants representing design choices for colors, typography,
 * spacing, radii, shadows, buttons, inputs, cards, and badges.
 */

export const DESIGN_TOKENS = {
  colors: {
    accent: {
      light: '#6366F1',
      lightHover: '#4F46E5',
      dark: '#818CF8',
      darkHover: '#A5B4FC',
    },
    background: {
      light: '#FAFAFA',
      dark: '#09090B',
    },
    surface: {
      light: '#FFFFFF',
      dark: '#18181B',
    },
    border: {
      light: '#E4E4E7',
      dark: '#27272A',
    },
    text: {
      primaryLight: '#18181B',
      primaryDark: '#FAFAFA',
      secondaryLight: '#71717A',
      secondaryDark: '#A1A1AA',
    },
    semantic: {
      success: { light: '#16A34A', dark: '#22C55E' },
      error: { light: '#DC2626', dark: '#F87171' },
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
