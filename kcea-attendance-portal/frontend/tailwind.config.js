/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Railway/IRCTC inspired colors
        'railway': {
          'blue': '#188CFF',      // Primary blue for buttons & headings
          'teal': '#00BFA6',      // Accent teal for highlights
          'gray': '#F8FAFC',      // Light background
          'dark': '#1F2937',      // Dark text
          'light': '#FFFFFF',     // White cards
          'border': '#E5E7EB',    // Subtle borders
          'success': '#10B981',   // Success green
          'warning': '#F59E0B',   // Warning amber
          'error': '#EF4444'      // Error red
        },
        // KCEA brand colors
        'kcea': {
          'primary': '#188CFF',
          'secondary': '#00BFA6',
          'accent': '#F59E0B',
          'neutral': '#6B7280'
        }
      },
      fontFamily: {
        'railway': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
      },
      borderRadius: {
        'railway': '12px',
        'card': '16px',
        'button': '8px'
      },
      boxShadow: {
        'railway': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'button': '0 4px 14px 0 rgba(24, 140, 255, 0.39)',
        'button-hover': '0 6px 20px rgba(24, 140, 255, 0.4)',
        'soft': '0 2px 4px rgba(0,0,0,0.1)'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
        'pulse-soft': 'pulseSoft 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        }
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    }),
    require('@tailwindcss/typography'),
    // Custom plugin for Railway-style components
    function({ addComponents, theme }) {
      addComponents({
        '.railway-card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.card'),
          boxShadow: theme('boxShadow.card'),
          padding: theme('spacing.6'),
          border: `1px solid ${theme('colors.railway.border')}`
        },
        '.railway-button': {
          backgroundColor: theme('colors.railway.blue'),
          color: theme('colors.white'),
          borderRadius: theme('borderRadius.button'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          fontWeight: theme('fontWeight.semibold'),
          fontSize: theme('fontSize.base'),
          boxShadow: theme('boxShadow.button'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme('boxShadow.button-hover'),
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        },
        '.railway-button-secondary': {
          backgroundColor: theme('colors.railway.teal'),
          color: theme('colors.white'),
          borderRadius: theme('borderRadius.button'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          fontWeight: theme('fontWeight.semibold'),
          fontSize: theme('fontSize.base'),
          boxShadow: '0 4px 14px 0 rgba(0, 191, 166, 0.39)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0, 191, 166, 0.4)',
            transform: 'translateY(-1px)'
          }
        },
        '.railway-input': {
          borderRadius: theme('borderRadius.button'),
          borderColor: theme('colors.railway.border'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.base'),
          '&:focus': {
            borderColor: theme('colors.railway.blue'),
            boxShadow: `0 0 0 3px ${theme('colors.railway.blue')}20`
          }
        },
        '.railway-nav': {
          backgroundColor: theme('colors.white'),
          borderBottom: `1px solid ${theme('colors.railway.border')}`,
          boxShadow: theme('boxShadow.soft')
        }
      })
    }
  ]
}
