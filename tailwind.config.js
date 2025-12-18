/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Override commonly used Tailwind blues to match brand
        blue: {
          50: '#e8f2f9',
          100: '#dbeaf5',
          200: '#b7d5ea',
          300: '#93c0df',
          400: '#6facd4',
          500: '#4b97c9',
          600: '#2b78ac', // primary brand color
          700: '#236491',
          800: '#1b4f75',
          900: '#143a59',
        },
        primary: '#2b78ac',
      },
    },
  },
  plugins: [],
};
