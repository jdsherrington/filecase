// web/src/routes/index.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { AppLayout } from "~/components/AppLayout";
import { LandingPage } from "~/components/LandingPage";

// This is our main "dispatcher" component for the root route.
function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  // While Clerk is determining the auth state, render nothing to avoid flicker.
  if (!isLoaded) {
    return null;
  }

  // Based on the sign-in status, render the correct entire UI.
  if (isSignedIn) {
    // If the user is logged in, render the full application dashboard.
    return <AppLayout />;
  } else {
    // If the user is logged out, render the public marketing page.
    return <LandingPage />;
  }
}

// Configure the route for `/`
export const Route = createFileRoute("/")({
  component: Index,
});
