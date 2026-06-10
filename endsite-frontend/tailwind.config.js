// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black:  '#000000',
          white:  '#FFFFFF',
          grey: {
            100: '#F5F5F5',
            200: '#E0E0E0',
            500: '#888888',
            900: '#1A1A1A',
          }
        },
        // SKYPEOPLE exact tokens
        sky: {
          bg:      '#e9edf2',   // page background
          card:    '#dde1e9',   // card/section bg
          text:    '#484e5a',   // primary text
          meta:    '#949dae',   // secondary text
          muted:   '#86909c',   // muted text
          border:  '#d2dae3',   // borders
          black:   '#000000',
          white:   '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.25em',
        wider:  '0.15em',
        wide:   '0.1em',
      },
      borderRadius: {
        none: '0px',
        sm:   '2px',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        slideIn: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)'    },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)'    },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'marquee':  'marquee 20s linear infinite',
      },
    },
  },
  plugins: [],
}