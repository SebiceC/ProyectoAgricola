/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'agri-green': '#10B981', // Verde cultivo
        'agri-dark': '#064E3B',  // Verde bosque
        'agri-light': '#D1FAE5', // Fondo suave
      }
    },
  },
  plugins: [],
}