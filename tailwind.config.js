/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: '#0e1116',
        slate: '#161b22',
        chrome: '#8f98a3',
        uranium: '#78a37b',
        amber: '#b89659',
        steel: '#5f7fa7',
        critical: '#a56565',
      },
      boxShadow: {
        panel: '0 20px 45px rgba(2, 6, 23, 0.28)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'sans-serif'],
        display: ['"Manrope"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"SFMono-Regular"', 'monospace'],
      },
    },
  },
  plugins: [],
}
