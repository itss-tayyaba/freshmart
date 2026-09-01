/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#07382c',
          green: '#0b4d3c',
          primary: '#0e5a47',
          light: '#14765d',
          emerald: '#10b981',
          accent: '#f35a22',
          accentHover: '#e04c16',
          yellow: '#f59e0b',
          lime: '#84cc16'
        },
        promo: {
          pink: '#fce7f3',
          green: '#e8f5e9',
          peach: '#ffedd5',
          lavender: '#f3e8ff'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 30px -4px rgba(11, 77, 60, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 30px -5px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    },
  },
  plugins: [],
}
