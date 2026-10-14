/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'sans-serif'],
        serif: ['"Newsreader"', 'Georgia', 'serif'],
        mono: ['"Space Mono"', 'monospace'],
        display: ['"Bricolage Grotesque"', 'sans-serif'],
      },
      colors: {
        paper: {
          bg: '#fff8f5',
          card: '#ffffff',
          memo: '#ffddb6',
          sage: '#c8ecca',
          peach: '#ffdbcf',
          ink: '#1e1b19',
          muted: '#594139',
          border: '#1e1b19'
        },
        ink: '#1e1b19',
        terracotta: {
          DEFAULT: '#cb4914',
          dark: '#872a00',
          light: '#ffdbcf'
        },
        sage: {
          DEFAULT: '#37613d',
          light: '#c8ecca'
        },
        amber: {
          DEFAULT: '#d97706',
          dark: '#805200',
          light: '#ffddb6'
        }
      },
      boxShadow: {
        'press': '3px 3px 0 #1e1b19',
        'press-sm': '2px 2px 0 #1e1b19',
        'press-lg': '4px 4px 0 #1e1b19',
        'press-xs': '1.5px 1.5px 0 #1e1b19',
      }
    },
  },
  plugins: [],
}
