/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050505',
          900: '#0a0a0b',
          850: '#0f0f11',
          800: '#141417',
          750: '#1a1a1e',
          700: '#222227',
          600: '#2d2d34',
          500: '#3a3a42',
          400: '#4a4a54',
        },
        gold: {
          50: '#fbf6e9',
          100: '#f5ebcc',
          200: '#ecd699',
          300: '#e0c066',
          400: '#d4ab3d',
          500: '#c49a2e',
          600: '#a87f24',
          700: '#8a6820',
          800: '#6b5019',
          900: '#4d3a13',
        },
        cream: {
          50: '#fdfbf7',
          100: '#f9f5ec',
          200: '#f0e9d8',
          300: '#e4d9c0',
          400: '#c9b994',
        },
      },
      fontFamily: {
        display: ['Marcellus', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 80s linear infinite',
        'spin-slow-reverse': 'spin-reverse 100s linear infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-up': 'fade-up 0.7s ease-out forwards',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 12s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'pulse-gold': {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(196,154,46,0.3))' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(196,154,46,0.5))' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'gold-gradient':
          'linear-gradient(135deg, #d4ab3d 0%, #f5ebcc 30%, #c49a2e 50%, #e0c066 70%, #a87f24 100%)',
        'gold-sheen':
          'linear-gradient(110deg, transparent 30%, rgba(229,201,107,0.15) 50%, transparent 70%)',
        'radial-gold': 'radial-gradient(circle at center, rgba(196,154,46,0.12) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
};
