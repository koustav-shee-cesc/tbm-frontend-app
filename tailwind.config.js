// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          // Add your custom font families here
          roboto: ['"Roboto"', 'sans-serif'], // Make sure to use quotes if the font name has spaces
          outfit: ['"Outfit"', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }