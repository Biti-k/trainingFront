/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'glass-bg': 'rgba(5, 46, 22, 0.35)',
        'glass-border': 'rgba(34, 197, 94, 0.20)',
        'green-glass': 'rgba(5, 46, 22, 0.35)',
      },
    },
  },
  plugins: [],
}
