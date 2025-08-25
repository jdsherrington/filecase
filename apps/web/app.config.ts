// web/app.config.ts

/*
This file serves as the central configuration for the frontend 'web' application's build and development process. It is required by the TanStack Start toolkit, which uses Vite under the hood as the build tool. Its primary purpose is to instruct the development server and production build process on how to handle the source code. Specifically, it tells TanStack Router where to find the application's source files for its file-based routing and code generation, and it configures Vite plugins, such as `vite-tsconfig-paths`, which allows for cleaner, non-relative import paths (e.g., `@/components/MyComponent`) by reading the aliases from the `tsconfig.json` file. In the overall application design, this file is the blueprint for how your frontend code is compiled, bundled, and prepared to be served to the user's browser.
*/

// Import the 'defineConfig' helper function from the TanStack Start configuration library.
// This function doesn't do much at runtime, but it provides TypeScript type-checking and
// autocompletion for the configuration object below, preventing typos and common mistakes.
import { defineConfig } from "@tanstack/start/config";

// Import the vite-tsconfig-paths plugin. This plugin allows Vite (the build tool) to
// understand and resolve the path aliases you might define in your 'tsconfig.json' file.
import tsConfigPaths from "vite-tsconfig-paths";

// Export this configuration object as the default export. The TanStack Start command-line
// interface (CLI) will automatically find and load this file to get its instructions.
export default defineConfig({
  // 'tsr' is the configuration namespace for TanStack Router.
  tsr: {
    // This setting tells TanStack Router's tools (like its code generator) that the
    // main application code, including the 'routes' directory, is located inside 'src/'.
    appDirectory: "src",
  },

  // 'vite' is the configuration namespace for Vite, the underlying build tool.
  // TanStack Start is built on top of Vite and allows you to pass custom Vite configurations here.
  vite: {
    // The 'plugins' array is where you can add and configure Vite plugins to extend its functionality.
    plugins: [
      // Initialize the tsConfigPaths plugin.
      tsConfigPaths({
        // This tells the plugin which tsconfig file(s) to read for path aliases.
        // In this case, it's pointing to the tsconfig.json in the current directory ('apps/web/').
        projects: ["./tsconfig.json"],
      }),
    ],
  },
});
