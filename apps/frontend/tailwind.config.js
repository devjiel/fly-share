/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          background: '#0a0a0a',
          card: '#141414',
          text: '#ffffff',
          primary: '#111111',
          secondary: '#1f1f1f',
          accent: '#3b82f6',
          muted: '#6b7280',
          border: '#2a2a2a'
        },
      },
      textColor: {
        hyperlink: '#ffffff',
      },
    },
  },
  plugins: [],
} 