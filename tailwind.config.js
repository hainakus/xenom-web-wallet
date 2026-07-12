/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Rajdhani', 'system-ui', 'sans-serif'],
        mono:    ['Share Tech Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      colors: {
        bg: {
          base:    '#04040a',
          panel:   'rgba(11,10,20,0.66)',
          gray:    '#12101f',
          hover:   'rgba(79,232,255,0.10)',
        },
        border: {
          DEFAULT: 'rgba(124,92,255,0.18)',
          bright:  'rgba(79,232,255,0.30)',
        },
        green: {
          DEFAULT: '#4fe8ff',
          dark:    '#20c9e6',
          dim:     'rgba(79,232,255,0.12)',
        },
        cyan: {
          DEFAULT: '#4fe8ff',
        },
        text: {
          DEFAULT: '#f5f2ff',
          muted:   '#9b94ba',
          bright:  '#fff8ff',
        },
        status: {
          red:     '#ff6aa9',
          yellow:  '#f7c65b',
          green:   '#4fe8ff',
        },
      },
      boxShadow: {
        glow:    '0 0 20px rgba(79,232,255,0.18)',
        'glow-lg':'0 0 40px rgba(176,92,255,0.22)',
        panel:   '0 0 0 1px rgba(124,92,255,0.18)',
      },
    },
  },
  plugins: [],
};
