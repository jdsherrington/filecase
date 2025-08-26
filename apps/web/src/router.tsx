// web/src/router.tsx

/*
 * This file serves as the central configuration point for the frontend router.
 * It defines a `createRouter` function that initializes and configures the
 * TanStack Router instance. This is essential for the single-page application (SPA)
 * architecture, as it handles all client-side navigation without full page reloads.
 * The function integrates authentication context from Clerk, making the user's auth
 * state available to all routes. It also sets up global defaults for error handling
 * and "not found" pages, ensuring a consistent user experience. In the overall
 * application design, this router is the core of the frontend, mapping URLs to
 * specific React components and managing the application's view state.
 */

import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    context: {
      auth: undefined!,
    },
    // Sets the default preloading strategy to 'intent', which means the router will start
    // preloading a route's data and components when the user hovers over or focuses a link.
    defaultPreload: "intent",
    // Specifies the component to render application-wide when a route throws an unhandled error.
    defaultErrorComponent: DefaultCatchBoundary,
    // Specifies the component to render when no route matches the current URL path.
    defaultNotFoundComponent: () => <NotFound />,
    // Enables automatic scroll position restoration on browser navigation (e.g., using back/forward buttons).
    scrollRestoration: true,
  });

  // Returns the fully configured router instance.
  return router;
}

// This is a TypeScript feature called "module augmentation" or "declaration merging".
// It enhances the original type definitions from the "@tanstack/react-router" library.
declare module "@tanstack/react-router" {
  // The `Register` interface is a special interface provided by TanStack Router for type augmentation.
  interface Register {
    // This line tells TypeScript the exact type of the `router` instance, including its custom
    // `context` (which has the `auth` property). This provides full type-safety and autocompletion
    // for the router's context throughout the entire application.
    router: ReturnType<typeof createRouter>;
  }
}
