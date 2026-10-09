/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        explore: {
          DEFAULT: '#2DD4BF',
          dark: '#0D9488',
        },
        heritage: {
          DEFAULT: '#FBBF24',
          dark: '#B45309',
        },
        safety: {
          DEFAULT: '#F87171',
          dark: '#B91C1C',
        },
        compare: {
          DEFAULT: '#A78BFA',
          dark: '#6D28D9',
        },
        insights: {
          DEFAULT: '#60A5FA',
          dark: '#1D4ED8',
        },
        report: {
          DEFAULT: '#F472B6',
          dark: '#BE185D',
        },
        dark: {
          bg: '#0B1020',
          surface: '#141A2D',
          border: 'rgba(255, 255, 255, 0.10)',
          text: '#E8ECF8',
          muted: '#9AA4BF',
        },
        light: {
          bg: '#F5F7FB',
          surface: '#FFFFFF',
          border: 'rgba(15, 23, 42, 0.10)',
          text: '#0F172A',
          muted: '#51607A',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
