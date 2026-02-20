import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // IdosoLink Health-Focused Color Palette
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
          light: 'var(--color-secondary-light)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        warm: {
          DEFAULT: 'var(--color-warm)',
          foreground: 'var(--color-warm-foreground)',
          light: 'var(--color-warm-light)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          foreground: 'var(--color-success-foreground)',
          light: 'var(--color-success-light)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          foreground: 'var(--color-warning-foreground)',
          light: 'var(--color-warning-light)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          foreground: 'var(--color-error-foreground)',
          light: 'var(--color-error-light)',
        },
        // Base colors
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        surface: 'var(--color-surface)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        // Legacy compatibility
        card: {
          DEFAULT: 'var(--color-surface)',
          foreground: 'var(--color-foreground)',
        },
        popover: {
          DEFAULT: 'var(--color-surface)',
          foreground: 'var(--color-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--color-error)',
          foreground: 'var(--color-error-foreground)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        // Sidebar
        sidebar: {
          DEFAULT: 'var(--color-surface)',
          foreground: 'var(--color-foreground)',
          primary: 'var(--color-primary)',
          'primary-foreground': 'var(--color-primary-foreground)',
          accent: 'var(--color-muted)',
          'accent-foreground': 'var(--color-foreground)',
          border: 'var(--color-border)',
          ring: 'var(--color-ring)',
        },
        chart: {
          '1': 'var(--color-primary)',
          '2': 'var(--color-secondary)',
          '3': 'var(--color-accent)',
          '4': 'var(--color-warm)',
          '5': 'var(--color-success)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Larger base sizes for accessibility (seniors)
        'xs': ['0.8125rem', { lineHeight: '1.5' }],    // 13px
        'sm': ['0.9375rem', { lineHeight: '1.5' }],    // 15px
        'base': ['1.0625rem', { lineHeight: '1.6' }],  // 17px
        'lg': ['1.1875rem', { lineHeight: '1.5' }],   // 19px
        'xl': ['1.375rem', { lineHeight: '1.4' }],     // 22px
        '2xl': ['1.625rem', { lineHeight: '1.35' }],   // 26px
        '3xl': ['2rem', { lineHeight: '1.3' }],        // 32px
        '4xl': ['2.5rem', { lineHeight: '1.2' }],      // 40px
        '5xl': ['3rem', { lineHeight: '1.15' }],       // 48px
      },
      spacing: {
        // Accessible spacing scale (larger touch targets)
        'touch': '2.75rem',  // 44px - minimum touch target
        'touch-lg': '3.5rem', // 56px - large touch target
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'sm': '0.375rem',    // 6px
        'md': '0.625rem',    // 10px
        'lg': '0.875rem',    // 14px
        'xl': '1.125rem',    // 18px
        '2xl': '1.5rem',     // 24px
        '3xl': '2rem',       // 32px
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.08)',
        'soft-md': '0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 8px 24px -4px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 16px 48px -8px rgba(0, 0, 0, 0.12)',
        'soft-xl': '0 12px 32px -8px rgba(0, 0, 0, 0.1), 0 24px 64px -12px rgba(0, 0, 0, 0.14)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
