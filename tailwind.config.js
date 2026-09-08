/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        // Dark-theme surface/text tokens - see src/app/globals.css for the
        // actual values (CSS custom properties). Named, not hardcoded, so a
        // future light-mode toggle only ever needs to change the variables,
        // never every component that uses them.
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
}
