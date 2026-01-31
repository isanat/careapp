import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#050b1f',
        card: '#0b1535',
        accent: '#7bd5ff',
        accentStrong: '#4aa3ff',
        silver: '#d5e0f0'
      }
    }
  },
  plugins: []
};

export default config;
