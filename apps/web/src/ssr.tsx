// web/src/ssr.tsx

/*
 * This file configures and exports the server-side rendering (SSR) handler for the frontend application.
 * SSR is essential for rendering the initial page HTML on the server, which is then sent to the client's browser.
 * This approach significantly improves initial page load times and is crucial for Search Engine Optimization (SEO),
 * as search crawlers can easily index the pre-rendered content. In the application's design, this file serves
 * as the server-side entry point for the 'web' app, integrating the core routing logic from TanStack Router
 * with the authentication layer from Clerk to generate a fully-formed, state-aware HTML document for every incoming request.
 */

// This is a TypeScript triple-slash directive. It's not executable code but a command for the compiler.
// It instructs TypeScript to include the type definitions from Vinxi's server environment,
// enabling type-checking and autocompletion for server-specific APIs provided by the build tool.
/// <reference types="vinxi/types/server" />

// Imports necessary functions from the TanStack Start server library.
import {
  // A factory function that creates the main server-side request handler.
  createStartHandler,
  // A handler that streams the rendered HTML response to the client, improving perceived performance.
  defaultStreamHandler,
} from "@tanstack/react-start/server";

// Imports a function to access the router manifest.
// The manifest is a file generated at build time that lists all application routes,
// allowing the server to know which components to render for a given URL.
import { getRouterManifest } from "@tanstack/react-start/router-manifest";

// Imports the function that creates the application's router instance from a local file.
// This centralizes the router's creation logic.
import { createRouter } from "./router";

// Imports a higher-order function from the Clerk authentication library.
// This function is specifically designed to wrap the TanStack Start handler to inject authentication logic.
import { createClerkHandler } from "@clerk/tanstack-react-start/server";

// This is the main export of the file, which constructs and exports the final request handler.
// The logic is composed by wrapping functions, working from the inside out.
export default createClerkHandler(
  // Second, the base handler from `createStartHandler` is passed to `createClerkHandler`.
  // This wraps the application's rendering logic with Clerk's authentication context,
  // making user session data available during the server-side render.
  createStartHandler({
    // First, a base request handler is configured using `createStartHandler`.
    // It's provided with the `createRouter` function to instantiate the router on each request.
    createRouter,
    // It's also given the `getRouterManifest` to resolve routes.
    getRouterManifest,
  }),
  // Finally, the result of the `createClerkHandler` is a function that takes a stream handler.
  // By passing `defaultStreamHandler`, the entire process is configured to stream the final
  // HTML (now including both page content and authentication state) to the client.
)(defaultStreamHandler);
