// web/src/routes/__root.tsx

/*
This __root.tsx file defines the root layout for the entire web application, acting as the
foundational shell for all pages. Its purpose is to establish the main HTML structure
(<html>, <head>, <body>), which is necessary for providing a consistent user interface and
centralizing global concerns. It handles application-wide elements such as the main
navigation bar, global stylesheets, default SEO metadata, and context providers like
Clerk for authentication. In the context of TanStack Router's file-based routing, this
component is the top-level parent, and all other page components are rendered inside its
<Outlet />, ensuring a unified structure for the application.
*/

import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { shadcn } from "@clerk/themes";
import { ThemeProvider } from "../components/theme-provider";
import {
  HeadContent, // A component that renders the metadata defined in the route's `head` option.
  Link, // A component for client-side navigation, similar to an `<a>` tag but for SPAs.
  Outlet, // A placeholder component where child routes will be rendered.
  Scripts, // A component that injects the necessary JavaScript files into the document.
  createRootRoute, // A function to define the configuration for the top-level route of the application.
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import * as React from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { CompleteProfileDialog } from '~/components/CompleteProfileDialog';
import { CreateOrganizationDialog } from '~/components/CreateOrganizationDialog';
import { api } from '~/api';
import Cookies from 'js-cookie';

// Defines a TypeScript interface for the router's context. This allows type-safe access to shared data, like authentication status, across routes.
interface MyRouterContext {
  auth: ReturnType<typeof useAuth>; // The context will contain authentication data provided by the `useAuth` hook from Clerk.
}

const queryClient = new QueryClient();

// Exports the route configuration, created using TanStack Router's `createRootRoute` function. This is how the file-based router discovers this root layout.
export const Route = createRootRoute<MyRouterContext>({
  // Specifies the component to render when an error is caught in any child route.
  errorComponent: (props) => (
    // It reuses the main document structure to ensure errors are displayed within a consistent layout.
    <RootDocument>
      {/* Renders the custom error boundary component, passing along error details. */}
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  // Specifies the component to render when no route matches the URL (a 404 Not Found error).
  notFoundComponent: () => <NotFound />,
  // Specifies the main React component that will be rendered for this root route's layout.
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <ClerkProvider
          appearance={{
            baseTheme: shadcn,
          }}
        >
          <AppWithAuth />
        </ClerkProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppWithAuth() {
  const { isSignedIn, getToken } = useAuth();
  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      return api.users.getMe({ token });
    },
    enabled: !!isSignedIn,
  });

  const { data: orgCheck, refetch: refetchOrgCheck } = useQuery({
    queryKey: ["org", "check"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      return api.orgs.check({ token });
    },
    enabled: false, // Initially disabled
  });

  const { mutate: updateUser } = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      return api.users.updateMe({ token, data });
    },
    onSuccess: () => {
      refetchUser();
      refetchOrgCheck();
    },
  });

  const { mutate: createOrganization } = useMutation({
    mutationFn: async (data: { name: string }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      return api.orgs.create({ token, data });
    },
    onSuccess: () => {
      refetchOrgCheck();
    },
  });

  React.useEffect(() => {
    if (isSignedIn) {
      refetchOrgCheck();
    }
  }, [isSignedIn, refetchOrgCheck]);

  React.useEffect(() => {
    if (orgCheck?.orgId) {
      Cookies.set('orgId', orgCheck.orgId);
    }
  }, [orgCheck]);

  const isProfileComplete = isSignedIn && user && user.firstname && user.lastname;
  const hasOrg = orgCheck?.hasOrg;

  const showCreateOrgDialog = isProfileComplete && !hasOrg;

  return (
    <>
      {isProfileComplete && hasOrg ? <Outlet /> : null}
      <CompleteProfileDialog
        open={!isProfileComplete}
        onSubmit={updateUser}
      />
      <CreateOrganizationDialog
        open={showCreateOrgDialog}
        user={user}
        onSubmit={createOrganization}
      />
    </>
  );
}


