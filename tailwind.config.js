/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        mist: {
          50: '#fbfcfc',
          100: '#f4f6f6',
          200: '#e8ecec',
          300: '#d6dcdd',
          400: '#a8b4b6',
          500: '#7a8a8d',
          600: '#5f6e70',
          700: '#4d5a5c',
          800: '#384244',
          900: '#2a3234',
          950: '#1a2022',
        },
      },
      fontFamily: {
        sans: ['Familjen Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
