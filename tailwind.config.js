/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#10110f',
        panel: '#171815',
        line: '#292a25',
        muted: '#8d9085',
        accent: '#e8e9a8',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 40px rgba(0,0,0,.18)',
      },
    },
  },
  plugins: [],
}
