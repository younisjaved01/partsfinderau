/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // PARTS IQ brand identity — industrial charcoal + molten orange
        ink: {
          50: '#eef1f4',
          100: '#d3d8df',
          200: '#b4bcc7',
          300: '#949fad',
          400: '#6f7b8b',
          500: '#55606f',
          600: '#323945',
          700: '#252b34',
          750: '#1e232b',
          800: '#181c22',
          850: '#14171c',
          900: '#0f1115',
          950: '#0a0b0d',
        },
        iq: {
          // molten orange accent
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#feccaa',
          300: '#fdac74',
          400: '#fb8a3c',
          500: '#f97316',
          600: '#ea5a0b',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        signal: {
          green: '#34d399',
          amber: '#fbbf24',
          red: '#f87171',
          blue: '#60a5fa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(249,115,22,0.35), 0 8px 32px -8px rgba(249,115,22,0.35)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scan': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'scan': 'scan 1.4s ease-in-out infinite alternate',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
