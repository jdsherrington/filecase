// app.config.ts
import { defineConfig } from "@tanstack/start/config";
import tsConfigPaths from "vite-tsconfig-paths";
var app_config_default = defineConfig({
  // 'tsr' is the configuration namespace for TanStack Router.
  tsr: {
    // This setting tells TanStack Router's tools (like its code generator) that the
    // main application code, including the 'routes' directory, is located inside 'src/'.
    appDirectory: "src"
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
        projects: ["./tsconfig.json"]
      })
    ]
  }
});
export {
  app_config_default as default
};
