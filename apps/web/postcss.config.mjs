// web/postcss.config.mjs

/**
 * This file configures PostCSS, a tool that transforms your CSS using JavaScript plugins. It's a critical part of the frontend (`apps/web`) build process.
 * Its primary purpose is to enable modern CSS features and frameworks that aren't natively understood by browsers. Specifically, it processes Tailwind's
 * utility classes by scanning your code and generating the corresponding standard CSS. It also runs Autoprefixer to automatically add vendor prefixes
 * (e.g., -webkit-, -moz-) to CSS rules, ensuring your styles are compatible across a wide range of web browsers without manual effort. In essence, this
 * file makes it possible to write clean, modern, utility-first CSS that works everywhere.
 */

// This uses ES Module syntax (`export default`) to export the configuration object. PostCSS will automatically find and load this file to know which plugins to run.
export default {
  // The `plugins` object is where you define which PostCSS plugins to activate.
  // The keys are the names of the plugins, and the values are their specific options.
  plugins: {
    // This line enables the Tailwind CSS plugin.
    // It scans your HTML, JSX, and TSX files for Tailwind classes (like 'p-4', 'text-center')
    // and generates the actual CSS that styles your components.
    // The empty object `{}` tells the plugin to use its default configuration,
    // which includes looking for a 'tailwind.config.mjs' file for your custom theme settings.
    tailwindcss: {},

    // This line enables the Autoprefixer plugin.
    // It automatically adds browser-specific prefixes to CSS properties to ensure
    // that your styles work correctly on older or different browsers. For example,
    // it can turn `display: flex` into `display: -webkit-flex; display: flex;`.
    // The empty object `{}` means it will use its default settings, typically
    // determined by a `browserslist` configuration in your `package.json`.
    autoprefixer: {},
  },
};
