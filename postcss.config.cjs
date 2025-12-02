// Tailwind's PostCSS plugin has moved to a separate package `@tailwindcss/postcss`.
// Ensure that package is installed and Next.js will pick it up automatically.
module.exports = {
  plugins: {
    // Use the new standalone PostCSS plugin package name
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
