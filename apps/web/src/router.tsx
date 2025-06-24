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

// Imports a server-side utility from Clerk to extract authentication state from an incoming request.
import { getAuth } from "@clerk/tanstack-react-start/server";
// Imports the main function from TanStack Router used to create a new router instance.
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
// Imports a custom React component to serve as a global fallback for rendering errors.
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
// Imports a custom React component to display when a requested route is not found (a 404 page).
import { NotFound } from "./components/NotFound";
// Imports the automatically generated route tree. This file is created by TanStack Router's CLI
// based on the file structure in the `src/routes` directory.
import { routeTree } from "./routeTree.gen";

// Exports a function that creates and configures a new router instance.
// It accepts an optional `opts` object, which may contain a `Request` object when running on the server.
export function createRouter(opts?: { request?: Request }) {
  // Retrieves the authentication state. If a request object is provided (server-side context),
  // it uses `getAuth` to get the current user's state. Otherwise (client-side), it's set to undefined.
  // The `!` (non-null assertion) is used because the auth context is expected to be defined later client-side.
  const auth = opts?.request ? getAuth(opts.request) : undefined!;

  // Creates the router instance by calling the imported function with a configuration object.
  const router = createTanStackRouter({
    // Provides the router with the entire structure of application routes from the generated file.
    routeTree,
    // Defines a global context object that will be available to all routes.
    context: {
      // Makes the authentication state accessible throughout the application via the router context.
      auth,
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
