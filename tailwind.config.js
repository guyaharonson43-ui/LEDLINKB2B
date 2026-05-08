// tailwind.config.js
export default {
  content: [
    './catalog.html',
    './index.html',
    './tools.html',
    './guides.html',
    './src/**/*.{jsx,js}',
  ],
  theme: {
    extend: {
      colors: {
        surface:       '#F4F4F0',
        'surface-alt': '#ECEAE4',
        card:          '#FFFFFF',
        'card-hover':  '#FAFAF8',
        border:        '#E0DDD6',
        'border-dark': '#C8C4BC',
        nav:           '#1A1A1A',
        gold:          '#E8A020',
        'gold-dim':    '#C4880A',
        'gold-faint':  'rgba(232,160,32,0.12)',
        ink:           '#1C1C1C',
        'ink-soft':    '#555555',
        'ink-faint':   '#999999',
        muted:         '#777777',
      },
      fontFamily: { sans: ['Heebo', 'sans-serif'] },
    },
  },
  plugins: [],
};
