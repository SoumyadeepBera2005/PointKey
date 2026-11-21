/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#FBF8F2',
        beige: '#F4EBDD',
        'beige-border': '#E8DCB9',
        'beige-light': '#FAF4EB',
        navy: '#17324D',
        'navy-light': '#254E75',
        'navy-dark': '#0E1F30',
        forest: '#4F7A63',
        'forest-hover': '#3E614E',
        'forest-light': '#EAF2ED',
        orange: '#FF7A00',
        'orange-hover': '#E56D00',
        'orange-light': '#FFF4EB',
        trust: '#4F7A63',
        surface: '#FBF8F2',
      },
      boxShadow: {
        card: '0 8px 30px rgba(23, 50, 77, 0.07)',
      },
    },
  },
  plugins: [],
};

