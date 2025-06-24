// web/src/components/DefaultCatchBoundary.tsx

/*
 * This file defines the `DefaultCatchBoundary` React component, which serves as a global
 * error boundary for the application's routing. It is designed to "catch" and gracefully
 * handle unexpected errors that occur during a route's data loading or rendering phase.
 * Instead of letting the application crash, this component provides a user-friendly
 * error screen with options to recover, such as retrying the failed action or navigating
 * to a different page. In the overall application design, it is registered with
 * TanStack Router as the default `errorComponent`, ensuring a consistent and robust
 * error handling experience across all routes.
 */

// Imports necessary components, hooks, and types from the TanStack Router library.
import {
  ErrorComponent, // A built-in component from the router for displaying a default error message and stack trace.
  Link, // A component for creating navigation links that integrate with the router.
  rootRouteId, // A constant holding the unique ID of the application's root route.
  useMatch, // A hook to access information about the currently matched route.
  useRouter, // A hook to get access to the main router instance for programmatic navigation.
} from "@tanstack/react-router";
// Imports the type definition for the props that an error component receives.
import type { ErrorComponentProps } from "@tanstack/react-router";

// Defines the `DefaultCatchBoundary` functional component, accepting props that include the 'error' object.
export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  // Retrieves the router instance to perform actions like invalidating routes.
  const router = useRouter();
  // Uses the `useMatch` hook to determine if the current error occurred on the root route.
  const isRoot = useMatch({
    strict: false, // `strict: false` allows matching parent routes, not just the exact one.
    // The `select` function checks if the matched route's ID is the same as the root route's ID.
    select: (state) => state.id === rootRouteId,
  });

  // Logs the caught error to the developer console for debugging purposes.
  console.error("DefaultCatchBoundary Error:", error);

  // Returns the JSX that will be rendered as the error UI.
  return (
    // A container div styled with Tailwind CSS for centering content.
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      {/* Renders the default TanStack Router error component, which neatly formats the error details. */}
      <ErrorComponent error={error} />
      {/* A container for action buttons. */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* A button that allows the user to retry the failed action. */}
        <button
          // The `onClick` handler triggers the retry mechanism.
          onClick={() => {
            // `router.invalidate()` clears the cache for the current route and re-triggers its loader.
            router.invalidate();
          }}
          // Applies styling classes for the button's appearance.
          className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
        >
          Try Again
        </button>
        {/* Conditionally renders a "Home" or "Go Back" link based on whether the error is on the root route. */}
        {isRoot ? (
          // If the error occurred on the root route, a link to the homepage is shown.
          <Link
            to="/" // The destination of the link.
            // Applies styling classes for the link's appearance, matching the button.
            className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
          >
            Home
          </Link>
        ) : (
          // If the error occurred on a child route, a "Go Back" link is shown.
          <Link
            to="/" // The `to` prop is still required, but its default action is prevented.
            // Applies styling classes for the link's appearance.
            className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
            // The `onClick` handler provides custom "go back" functionality.
            onClick={(e) => {
              // Prevents the default link navigation to the homepage.
              e.preventDefault();
              // Uses the browser's built-in history API to navigate to the previous page.
              window.history.back();
            }}
          >
            Go Back
          </Link>
        )}
      </div>
    </div>
  );
}
