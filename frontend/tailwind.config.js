/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lumen: {
          bg: '#FAF7F2',
          surface: '#FFFFFF',
          input: '#EFECE6',
          border: '#EDE8DF',
          primary: '#1A382B',
          'primary-dark': '#11261D',
          'primary-light': '#2D5442',
          accent: '#D97736',
          muted: '#767065',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
