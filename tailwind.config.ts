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
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        surface: 'var(--color-surface)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
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
        sans: ['var(--font-roboto)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-roboto)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.5' }],
        'xl': ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.35' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
      },
      spacing: {
        'touch': '2.75rem',
        'touch-lg': '3.5rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.625rem',
        'lg': '0.875rem',
        'xl': '1.125rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.08)',
        'soft-md': '0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 8px 24px -4px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 16px 48px -8px rgba(0, 0, 0, 0.12)',
        'soft-xl': '0 12px 32px -8px rgba(0, 0, 0, 0.1), 0 24px 64px -12px rgba(0, 0, 0, 0.14)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
