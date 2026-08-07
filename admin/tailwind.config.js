/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#fff5f8',
          100: '#ffe4ee',
          200: '#ffc8dd',
          300: '#ffa3c4',
          400: '#f97ba7',
          500: '#ec4d84',
          600: '#d62d68',
          700: '#b31e52',
          800: '#8f1a44',
          900: '#78193c',
        },
        gold: {
          50: '#fdf9ec',
          100: '#f9edc7',
          200: '#f3da8f',
          300: '#ecc356',
          400: '#e6b02f',
          500: '#d19620',
          600: '#b3781b',
          700: '#8f5b19',
          800: '#77481a',
          900: '#663c1a',
        },
        cream: '#fffaf3',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Poppins"', 'sans-serif'],
      },
      boxShadow: {
        luxury: '0 10px 40px -10px rgba(214, 45, 104, 0.25)',
      },
    },
  },
  plugins: [],
};
