const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./resources/js/**/*.{js,ts,jsx,tsx}'],
  safelist: ['ProseMirror'],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-animate')],
};
