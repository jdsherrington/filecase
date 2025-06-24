// web/tailwind.config.mjs

/*
 * This is the configuration file for Tailwind CSS, a utility-first CSS framework used for styling the frontend 'web' application.
 * It's essential because it tells Tailwind which of your project's files to scan for class names (like `p-4` or `flex`).
 * During the build process, Tailwind analyzes these files and generates a highly optimized CSS file containing only the styles you
 * actually used. This keeps the final CSS bundle small and efficient, which is critical for a fast-loading website. This file is
 * central to the visual presentation layer of your React application, directly influencing how components are styled and appear
 * to the end-user.
 */

/** @type {import('tailwindcss').Config} */
// This is a special JSDoc comment. It provides type-checking and autocompletion for the configuration object
// in code editors that support TypeScript, like VS Code. It ensures you're using valid Tailwind options.
export default {
  darkMode: ["class"],
  // The 'content' property is the most important part of the configuration.
  // It defines the paths to all of your template files where you'll be writing Tailwind class names.
  content: [
    // This is a "glob" pattern that tells Tailwind to look for class names in specific files.
    // './src/': Start looking in the 'src' directory.
    // '**/': Look in the 'src' directory itself and all of its subdirectories, no matter how deeply nested.
    // '*.{js,jsx,ts,tsx}': Match any file that ends with one of these extensions (.js, .jsx, .ts, or .tsx).
    // This pattern effectively covers all the files in your React application where you would define components and use CSS classes.
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  // Note: This is a very minimal configuration. A more complex project might also include:
  // theme: { ... } // to customize colors, fonts, spacing, etc.
  // plugins: [ ... ] // to add extra utilities, like for form styles or aspect ratios.
  plugins: [require("tailwindcss-animate")],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
    },
  },
};
