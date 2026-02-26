/**
 * IdosoLink Design Tokens
 * Health & Care focused design system
 * NOT fintech/crypto aesthetic
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Primary - Teal (#2F6F6D) - Trust, Health, Calm
  primary: {
    DEFAULT: '#2F6F6D',
    light: '#4A8A87',
    dark: '#245856',
    foreground: '#FFFFFF',
  },
  
  // Secondary - Lighter Teal (#6FA8A3)
  secondary: {
    DEFAULT: '#6FA8A3',
    light: '#8FBDB9',
    foreground: '#FFFFFF',
  },
  
  // Accent - Soft Cyan (#A8DADC)
  accent: {
    DEFAULT: '#A8DADC',
    foreground: '#1F2933',
  },
  
  // Warm - Gold (#F1C27D) - Care, Warmth, Human touch
  warm: {
    DEFAULT: '#F1C27D',
    light: '#F7DDAF',
    foreground: '#1F2933',
  },
  
  // Background & Surface
  background: '#F7FAF9',
  surface: '#FFFFFF',
  
  // Text
  text: {
    primary: '#1F2933',
    secondary: '#6B7280',
    muted: '#9CA3AF',
  },
  
  // Semantic Colors (Soft, not harsh)
  success: {
    DEFAULT: '#5B9A6F',
    light: '#A8D5B8',
    foreground: '#FFFFFF',
  },
  
  warning: {
    DEFAULT: '#E8A65D',
    light: '#F5D4A8',
    foreground: '#1F2933',
  },
  
  error: {
    DEFAULT: '#C96B6B',
    light: '#F0C8C8',
    foreground: '#FFFFFF',
  },
  
  // UI Colors
  border: '#E0E7E5',
  muted: '#EEF3F2',
  input: '#E0E7E5',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  fontFamily: {
    heading: 'var(--font-poppins), system-ui, sans-serif',
    body: 'var(--font-inter), system-ui, sans-serif',
  },
  
  // Larger sizes for accessibility (seniors)
  fontSize: {
    xs: '0.8125rem',   // 13px
    sm: '0.9375rem',   // 15px
    base: '1.0625rem', // 17px (larger than default 16px)
    lg: '1.1875rem',   // 19px
    xl: '1.375rem',    // 22px
    '2xl': '1.625rem', // 26px
    '3xl': '2rem',     // 32px
    '4xl': '2.5rem',   // 40px
    '5xl': '3rem',     // 48px
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const radius = {
  none: '0',
  sm: '0.375rem',   // 6px - subtle
  md: '0.625rem',   // 10px - default
  lg: '0.875rem',   // 14px - cards
  xl: '1.125rem',   // 18px - larger elements
  '2xl': '1.5rem',  // 24px - modals
  '3xl': '2rem',    // 32px - feature cards
  full: '9999px',   // pills
} as const;

// =============================================================================
// SHADOWS (Soft, not harsh)
// =============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(47, 111, 109, 0.05)',
  DEFAULT: '0 2px 4px 0 rgba(47, 111, 109, 0.08)',
  md: '0 4px 8px 0 rgba(47, 111, 109, 0.1)',
  lg: '0 8px 16px 0 rgba(47, 111, 109, 0.12)',
  xl: '0 16px 32px 0 rgba(47, 111, 109, 0.15)',
  // Card shadow
  card: '0 2px 8px 0 rgba(47, 111, 109, 0.08), 0 1px 2px 0 rgba(47, 111, 109, 0.04)',
  // Focus ring
  focus: '0 0 0 3px rgba(47, 111, 109, 0.25)',
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  fast: '150ms ease',
  DEFAULT: '200ms ease',
  slow: '300ms ease',
  // For seniors: slower, more visible transitions
  accessible: '250ms ease',
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  dropdown: 50,
  sticky: 100,
  modal: 200,
  popover: 300,
  tooltip: 400,
  toast: 500,
} as const;

// =============================================================================
// COMPONENT SIZES (Accessibility focused)
// =============================================================================

export const componentSizes = {
  // Minimum touch target: 44px
  button: {
    sm: { height: '40px', padding: '0.625rem 1rem' },
    md: { height: '48px', padding: '0.75rem 1.5rem' },
    lg: { height: '56px', padding: '1rem 2rem' },
  },
  
  input: {
    sm: { height: '40px' },
    md: { height: '48px' },
    lg: { height: '56px' },
  },
  
  icon: {
    sm: '18px',
    md: '24px',
    lg: '32px',
    xl: '48px',
  },
} as const;

// =============================================================================
// SEMANTIC TOKENS
// =============================================================================

export const semanticTokens = {
  // Button variants
  button: {
    primary: {
      bg: colors.primary.DEFAULT,
      hover: colors.primary.dark,
      text: colors.primary.foreground,
    },
    secondary: {
      bg: colors.secondary.DEFAULT,
      hover: colors.primary.DEFAULT,
      text: colors.secondary.foreground,
    },
    ghost: {
      bg: 'transparent',
      hover: colors.muted,
      text: colors.text.primary,
    },
    warm: {
      bg: colors.warm.DEFAULT,
      hover: colors.warm.light,
      text: colors.warm.foreground,
    },
  },
  
  // Card variants
  card: {
    default: {
      bg: colors.surface,
      border: colors.border,
    },
    info: {
      bg: '#EEF8F7', // Light teal tint
      border: colors.secondary.light,
    },
    warning: {
      bg: '#FDF8EE', // Light warm tint
      border: colors.warm.light,
    },
    success: {
      bg: '#F0F9F2', // Light green tint
      border: colors.success.light,
    },
  },
  
  // Status badges
  badge: {
    active: { bg: colors.success.DEFAULT, text: colors.success.foreground },
    pending: { bg: colors.warning.DEFAULT, text: colors.warning.foreground },
    inactive: { bg: colors.muted, text: colors.text.secondary },
    error: { bg: colors.error.DEFAULT, text: colors.error.foreground },
  },
} as const;

// Export all tokens
export const designTokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  componentSizes,
  semanticTokens,
} as const;

export default designTokens;
