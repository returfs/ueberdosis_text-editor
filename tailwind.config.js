/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/js/**/*.{js,ts,jsx,tsx}',
    '../../node_modules/@returfs/shared-external-react/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  layers: ['utilities'],
  plugins: [],
};
