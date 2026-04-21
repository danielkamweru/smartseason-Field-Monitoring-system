/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'shamba-green': '#22c55e',
        'shamba-dark-green': '#16a34a',
        'shamba-deeper-green': '#14532d',
        'shamba-light-green': '#86efac',
        'shamba-earth': '#92400e',
        'shamba-sky': '#0ea5e9',
        'shamba-yellow': '#eab308',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
