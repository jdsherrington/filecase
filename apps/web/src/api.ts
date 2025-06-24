// web/src/api.ts

/**
 * This file serves as the primary entry point for the server-side API handlers
 * within the `web` application, a feature enabled by the TanStack Start framework.
 * It is necessary for creating a "full-stack" frontend, where the same server
 * that serves the React user interface can also respond to API requests. By
 * creating a main API handler, this file allows the application to use file-based
 * routing for its backend logic (e.g., a request to `/api/users` is automatically
 * handled by the code in `src/routes/api/users.ts`), effectively making the `web`
 * app self-sufficient for many of its data-fetching needs without always calling
 * the separate `apps/api` backend.
 */

// Import specific functions from the TanStack Start framework's API module.
import {
  // This is a factory function provided by TanStack Start. Its job is to create the main request handler
  // for your server-side API routes.
  createStartAPIHandler,
  // This is a pre-configured handler that knows how to find and execute your file-based API routes.
  // It contains the logic to map an incoming URL path (like '/api/users') to a file on disk (like 'src/routes/api/users.ts').
  defaultAPIFileRouteHandler,
} from "@tanstack/react-start/api"; // The package path where these utility functions are located.

// This line creates the final API handler and exports it as the default for this module.
// The `createStartAPIHandler` function takes the `defaultAPIFileRouteHandler` as its configuration.
// The resulting exported handler will be used by the TanStack Start server to process all incoming API requests
// by looking for corresponding files in the `src/routes/api/` directory.
export default createStartAPIHandler(defaultAPIFileRouteHandler);
