/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // PARTS IQ — rugged Australian 4WD identity.
        // Charcoal / near-black surfaces, muted sand text, olive/khaki + burnt
        // amber accents. Neutral, technical, trustworthy — no neon.
        ink: {
          50: '#f2efe9',
          100: '#ddd8cf',
          200: '#bcb6ab',
          300: '#948d81',
          400: '#6e675d',
          500: '#514b43',
          600: '#3a352f',
          700: '#2b2823',
          750: '#221f1b',
          800: '#1b1915',
          850: '#151310',
          900: '#100e0c',
          950: '#0a0908',
        },
        // Muted sand — warm neutral for secondary surfaces / text.
        sand: {
          50: '#f8f4ec',
          100: '#efe7d7',
          200: '#e0d3ba',
          300: '#ccb992',
          400: '#b39c6f',
          500: '#98805a',
          600: '#7a6647',
        },
        // Olive / khaki — field accent for tags, systems, secondary emphasis.
        field: {
          300: '#b9bb8f',
          400: '#9b9d68',
          500: '#7d7f4c',
          600: '#63653b',
          700: '#4b4c2d',
        },
        // Burnt amber — reserved for important actions & the brand mark.
        iq: {
          50: '#fdf6ec',
          100: '#f9e7cc',
          200: '#f1cb96',
          300: '#e8ab60',
          400: '#de8f39',
          500: '#cf7320',
          600: '#b65b16',
          700: '#934515',
          800: '#763918',
          900: '#623016',
        },
        signal: {
          green: '#5fae74',
          amber: '#e0a92e',
          red: '#d9683f',
          blue: '#5b93b8',
        },
      },
      fontFamily: {
        sans: ['Barlow', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Barlow Semi Condensed"', 'Barlow', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 10px 28px -14px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(207,115,32,0.35), 0 10px 34px -10px rgba(207,115,32,0.32)',
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
        scan: {
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
        scan: 'scan 1.4s ease-in-out infinite alternate',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
