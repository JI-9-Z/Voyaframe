/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      transitionTimingFunction: { ui: 'cubic-bezier(.16, 1, .3, 1)' },
    },
  },
  plugins: [],
}
