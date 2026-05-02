import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0c09',
          card: '#161a16',
          elevated: '#1c2018',
          inset: '#0e120d',
        },
        border: {
          DEFAULT: '#252a24',
          soft: '#1e221d',
        },
        text: {
          DEFAULT: '#e8ebe4',
          muted: '#8c9088',
          dim: '#5c6058',
        },
        accent: {
          DEFAULT: '#c6ff3d',
          hover: '#d4ff5c',
          dim: '#a3d82a',
          glow: 'rgba(198, 255, 61, 0.25)',
        },
        danger: '#ff6b5b',
        warning: '#ffb84d',
        success: '#4dffb8',
        // Extended palette for admin/dashboard
        emerald: '#4dffb8',
        amber: '#ffb84d',
        magenta: '#ff6b9d',
        sky: '#7dd3ff',
        info: '#7dd3ff',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(2rem, 4.5vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        glow: '0 0 30px rgba(198, 255, 61, 0.3), 0 0 60px rgba(198, 255, 61, 0.15)',
        'glow-sm': '0 0 16px rgba(198, 255, 61, 0.4)',
        'glow-lg': '0 0 60px rgba(198, 255, 61, 0.4), 0 0 120px rgba(198, 255, 61, 0.2)',
      },
      animation: {
        pulse: 'pulse 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, rgba(198,255,61,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(198,255,61,0.04) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
