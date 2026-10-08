import { defineConfig } from 'tailwindcss'

export default defineConfig({
  content: [
    './src/**/*.{html,ts}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'sv-green': {
          DEFAULT: '#1e462e',
          light: '#2a553a',
        },
        'sv-gold': {
          DEFAULT: '#c7a84c',
          dark: '#b3913b',
        },
        'sv-cream': '#f0ead6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
    },
  },
  plugins: [],
})
