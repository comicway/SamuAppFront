/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Variantes construidas dinámicamente (className={`md-btn--${variant}`}).
  // Tailwind no puede inferirlas del código, así que se declaran explícitamente.
  safelist: [
    'md-btn--filled',
    'md-btn--tonal',
    'md-btn--outlined',
    'md-btn--text',
    'md-chip--neutral',
    'md-chip--primary',
    'md-chip--secondary',
    'md-chip--success',
    'md-chip--warning',
    'md-chip--error',
    'md-chip--critical',
    'md-chip--demo',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
