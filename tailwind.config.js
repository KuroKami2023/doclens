/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm archival paper surfaces
        paper: {
          DEFAULT: '#FAF6EF',
          deep: '#F3EDE1',
          edge: '#E7DCC8',
        },
        // Deep espresso ink (replaces cold slate text)
        espresso: {
          50: '#FAF6EF',
          100: '#EFE7D8',
          200: '#E2D7C4',
          300: '#C9BBA9',
          400: '#A89787',
          500: '#857466',
          600: '#6B5D50',
          700: '#52443A',
          800: '#3A2E25',
          900: '#292019',
          950: '#1C1410',
        },
        // Burnt-orange scan lamp accent (replaces sky)
        lamp: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          500: '#EA580C',
          600: '#C2410C',
          700: '#9A3412',
        },
      },
      fontFamily: {
        display: ['Georgia', '"Times New Roman"', 'serif'],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },
      boxShadow: {
        // Paper sheet with subtle stacked-shadow edges
        card: '0 1px 0 0 #E7DCC8, 0 4px 0 -2px #F3EDE1, 0 8px 0 -4px #E7DCC8, 0 16px 32px -16px rgba(28, 20, 16, 0.25)',
        'card-hover':
          '0 1px 0 0 #E7DCC8, 0 5px 0 -2px #F3EDE1, 0 10px 0 -4px #E7DCC8, 0 24px 40px -16px rgba(28, 20, 16, 0.32)',
        'lamp-glow': '0 0 0 3px rgba(194, 65, 12, 0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        scan: {
          '0%': { top: '0%', opacity: '1' },
          '50%': { opacity: '1' },
          '100%': { top: 'calc(100% - 2px)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
        scan: 'scan 2.2s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};
