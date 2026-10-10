/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: {
            DEFAULT: '#111D4A',
            50: '#F0F2F9',
            100: '#D9DFF2',
            200: '#B3C0E5',
            300: '#8DA0D8',
            400: '#5E78C4',
            500: '#3452AB',
            600: '#23397D',
            700: '#1A295A',
            800: '#111D4A', // Space Indigo Base
            900: '#0B122F',
            950: '#060A1C',
          },
          teal: {
            DEFAULT: '#006D77', // Stormy Teal Base
            50: '#E6F5F6',
            100: '#C2E7EA',
            200: '#94D4DA',
            300: '#57B9C3',
            400: '#269CA8',
            500: '#006D77',
            600: '#005962',
            700: '#00464D',
            800: '#003338',
            900: '#002023',
          },
          mauve: {
            DEFAULT: '#713E5A', // Mauve Shadow Base
            50: '#F9F1F5',
            100: '#F1DCE8',
            200: '#E3B9D1',
            300: '#D190B6',
            400: '#B46493',
            500: '#954974',
            600: '#713E5A',
            700: '#5A3147',
            800: '#432435',
            900: '#2E1824',
          },
          apricot: {
            DEFAULT: '#FFCF99', // Apricot Cream Base
            50: '#FFFDF9',
            100: '#FFF7EB',
            200: '#FFEDD1',
            300: '#FFDFB3',
            400: '#FFCF99',
            500: '#F5B770',
            600: '#D9984E',
            700: '#B37734',
            800: '#8C571F',
            900: '#663B10',
          },
          floral: {
            DEFAULT: '#FFF8F0', // Floral White Base
            50: '#FFFFFF',
            100: '#FFFDFB',
            200: '#FFFBF5',
            300: '#FFF8F0',
            400: '#F7EDE1',
            500: '#EADBCC',
            600: '#C9B6A3',
            700: '#A4907D',
          }
        }
      },
      fontFamily: {
        sans: [
          'Tajawal',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace'
        ]
      }
    },
  },
  plugins: [],
}
