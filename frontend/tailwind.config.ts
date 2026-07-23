import type { Config } from 'tailwindcss';

/**
 * Дизайн-токены Crudo — минимал/foodtech.
 * Светлый фон, петрольный акцент, скруглённые карточки.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Бренд
        primary: {
          DEFAULT: '#0D5C57', // петроль
          50: '#E8F2F1',
          100: '#C7E3E0',
          200: '#9ECEC8',
          300: '#74B8B0',
          400: '#4DA298',
          500: '#0D5C57',
          600: '#0B4F4B',
          700: '#093F3C',
          800: '#072F2D',
          900: '#051F1E',
        },
        accent: {
          DEFAULT: '#7CE7C3', // мятный
          soft: '#B6F2DC',
        },
        // Нейтральные
        ink: '#1A1D1F',
        muted: '#6B7178',
        line: '#ECECE6',
        surface: '#FFFFFF',
        canvas: '#FAFAF7',
        danger: '#E5484D',
        warning: '#F5A524',
        success: '#30A46C',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)',
        pop: '0 8px 32px rgba(16,24,40,0.12)',
      },
      maxWidth: {
        page: '1200px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
