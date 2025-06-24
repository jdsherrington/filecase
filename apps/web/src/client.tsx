// web/src/client.tsx

/**
 * This file serves as the primary entry point for the client-side (browser) application. Its main purpose is to "hydrate"
 * the React application into the HTML document that was initially rendered by the server (SSR). This is essential
 * because for a fast initial page load and better SEO, the server sends a static, non-interactive version of the page.
 * This script then runs in the user's browser to attach event listeners and make the page fully dynamic, effectively
 * "waking up" the static HTML. In the overall application design, this file is the crucial final step that transforms
 * the server-rendered output into a fluid, modern Single Page Application (SPA), enabling features like client-side
 * routing and state management without full page reloads.
 */

// A TypeScript "triple-slash directive" that tells the compiler to include type definitions
// for Vinxi's client environment. Vinxi is likely the build tool/dev server used by your framework,
// and this provides type-safety for framework-specific features or environment variables available in the browser.
/// <reference types="vinxi/types/client" />

// Imports the 'hydrateRoot' function from the React DOM client library. This function is specifically
// used to attach React to an existing HTML structure that has been pre-rendered on a server.
// It "hydrates" the static HTML with interactivity, rather than creating it from scratch.
import { hydrateRoot } from "react-dom/client";

// Imports the 'StartClient' component from the TanStack React Start library. This component is a helper
// that wraps our application and provides the necessary context and setup for TanStack Router to
// function correctly in the browser environment.
import { StartClient } from "@tanstack/react-start";

// Imports the 'createRouter' function from our local './router.tsx' file. This function is responsible
// for creating and configuring our application's router instance with all the defined routes.
import { createRouter } from "./router";

// Creates an instance of our application's router by calling the imported 'createRouter' function.
// This 'router' object will manage all navigation, route matching, and data loading for the client-side app.
const router = createRouter();

// This is the core action of the file. It calls 'hydrateRoot' to attach our React application to the
// server-rendered HTML.
// - The first argument, `document`, specifies that the entire HTML document is the root container.
// - The second argument, `<StartClient router={router} />`, is our root React component. We pass our
//   `router` instance to it, which allows it to render the correct page component based on the URL
//   and handle all subsequent navigation.
hydrateRoot(document, <StartClient router={router} />);
