// web/src/routes/_authenticated.tsx

import { Outlet, createRoute, redirect, createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AppLayout } from "../components/AppLayout";
import { Route as rootRoute } from "./__root"; // Import the root route

// This is the main layout for the authenticated part of the app.
function AuthenticatedLayout() {
  return <AppLayout />;
}

// This creates the layout route.
export const Route = createFileRoute("/_authenticated")({
  // It's a child of the root route.
  getParentRoute: () => rootRoute,
  // This is a "pathless" layout route, so we give it a unique ID.
  // The underscore convention signifies that it doesn't add to the URL path.
  id: "_authenticated",
  // This is the security guard. It runs before the route loads.
  beforeLoad: ({ context, location }) => {
    // If the user is not signed in,
    if (!context.auth.isSignedIn) {
      // redirect them to the sign-in page.
      throw redirect({
        to: "/sign-in",
        search: {
          // Send the user back to the page they were trying to access after login.
          redirect: location.href,
        },
      });
    }
  },
  // This is the component that defines the layout's UI.
  component: AuthenticatedLayout,
});
