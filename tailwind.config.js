/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'mi-accent': 'rgb(180, 233, 0)',
        'mi-accented-bg': 'rgba(180, 233, 0, 0.15)',
      },
    },
  },
  plugins: [],
};
