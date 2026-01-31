import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2F6F6D',
        secondary: '#6FA8A3',
        accent: '#A8DADC',
        warm: '#F1C27D',
        background: '#F7FAF9',
        surface: '#FFFFFF',
        textPrimary: '#1F2933',
        textSecondary: '#6B7280',
        border: '#E5E7EB'
      },
      borderRadius: {
        xl: '1.25rem'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(31, 41, 51, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
