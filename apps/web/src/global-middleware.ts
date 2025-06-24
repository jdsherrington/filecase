// web/src/global-middleware.ts

/*
 * This file serves as the central registration point for global server-side middleware
 * within the frontend application. It uses the `registerGlobalMiddleware` function from
 * the TanStack Start framework to apply certain logic to every incoming server request
 * before it is processed by the specific route handler. This is essential for handling
 * cross-cutting concerns, such as logging, authentication checks, or setting common
 * response headers, in a single, maintainable location. In the overall application
 * design, this file acts as a universal interceptor for server-side rendering (SSR)
 * requests, ensuring consistent behavior across all pages.
 */

// Imports the `registerGlobalMiddleware` function from the @tanstack/react-start library.
// This function is the tool provided by the framework to set up middleware that runs on the server for every request.
import { registerGlobalMiddleware } from "@tanstack/react-start";

// Imports the custom `logMiddleware` function from a local utility file.
// This specific middleware is designed to log information about incoming requests.
import { logMiddleware } from "./utils/loggingMiddleware";

// Calls the `registerGlobalMiddleware` function to officially register the middleware with the framework.
registerGlobalMiddleware({
  // The `middleware` property accepts an array of middleware functions to be executed in order.
  // Here, it is being configured to use the imported `logMiddleware` for every server-side request.
  middleware: [logMiddleware],
});
