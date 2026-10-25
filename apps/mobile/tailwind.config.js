/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Inter, loaded in src/app/_layout.tsx. React Native picks a font per weight, so each weight
      // is its own family: font-inter, font-inter-medium, font-inter-semibold, font-inter-bold.
      fontFamily: {
        'inter-thin': ['Inter_200ExtraLight'],
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
      // Same token names as the web app's tailwind.config.js, so a class such as `bg-gf-surface`
      // or `text-gf-text-muted` means the same thing on both. The values live in src/global.css.
      colors: {
        'gf-bg': 'var(--gf-bg)',
        'gf-surface': 'var(--gf-surface)',
        'gf-surface-2': 'var(--gf-surface-2)',
        'gf-border': 'var(--gf-border)',
        'gf-text': 'var(--gf-text)',
        'gf-text-muted': 'var(--gf-text-muted)',
        'gf-accent-soft-bg': 'var(--gf-accent-soft-bg)',
        'gf-accent-soft-text': 'var(--gf-accent-soft-text)',
      },
    },
  },
  plugins: [],
};
