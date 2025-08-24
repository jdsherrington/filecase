// web/src/routes/index.tsx

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { AppLayout } from "~/components/AppLayout";
import * as React from "react";

// This is our main "dispatcher" component for the root route.
function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({
        to: "/sign-in",
      });
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return <AppLayout />;
}
// Configure the route for `/`
export const Route = createFileRoute("/")({
  component: Index,
});
