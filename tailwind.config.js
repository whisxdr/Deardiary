/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="night"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FAF6F0',
          100: '#F0E6D2',
          200: '#E0C9A6',
          300: '#C9A961',
          400: '#A67C52',
          500: '#7D5A3C',
          600: '#5D4037',
          700: '#3E2723',
          800: '#2A1A14',
          900: '#1A0F0A',
        },
        accent: {
          gold: '#C9A961',
          ink: '#1A237E',
          cream: '#F5F0E6',
          rose: '#B76E79',
          sage: '#8A9A5B',
        },
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#E53935',
        info: '#2196F3',
        // Theme-aware muted text; the values swap in night mode via CSS variables.
        muted: 'var(--text-muted)',
        faint: 'var(--text-faint)',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sub: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        hand: ['Caveat', '"Dancing Script"', 'cursive'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(62, 39, 35, 0.08)',
        medium: '0 4px 16px rgba(62, 39, 35, 0.12)',
        hard: '0 8px 32px rgba(62, 39, 35, 0.20)',
        book: '0 20px 60px rgba(62, 39, 35, 0.35), inset 0 0 100px rgba(0,0,0,0.05)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
        flip: '800ms',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        'ink-drop': {
          '0%': { opacity: '0', filter: 'blur(6px)', transform: 'translateY(4px)' },
          '100%': { opacity: '1', filter: 'blur(0)', transform: 'translateY(0)' },
        },
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-14px,0)' },
        },
        'fade-slide': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'ink-drop': 'ink-drop 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
        drift: 'drift 6s ease-in-out infinite',
        'fade-slide': 'fade-slide 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
