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
          base:    '#020408',
          panel:   '#060f0a',
          gray:    '#0d1f15',
          hover:   '#0a1a0f',
        },
        border: {
          DEFAULT: '#0f2a1a',
          bright:  'rgba(0,255,136,0.25)',
        },
        green: {
          DEFAULT: '#00ff88',
          dark:    '#00cc6a',
          dim:     'rgba(0,255,136,0.12)',
        },
        cyan: {
          DEFAULT: '#00e5ff',
        },
        text: {
          DEFAULT: '#7ab090',
          muted:   '#3a5040',
          bright:  '#b8d4c0',
        },
        status: {
          red:     '#ff3366',
          yellow:  '#ffcc00',
          green:   '#00ff88',
        },
      },
      boxShadow: {
        glow:    '0 0 20px rgba(0,255,136,0.15)',
        'glow-lg':'0 0 40px rgba(0,255,136,0.2)',
        panel:   '0 0 0 1px #0f2a1a',
      },
    },
  },
  plugins: [],
};
