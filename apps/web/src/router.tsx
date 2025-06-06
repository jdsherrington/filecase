import { getAuth } from "@clerk/tanstack-start/server";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

export function createRouter(opts?: { request?: Request }) {
  const auth = opts?.request ? getAuth(opts.request) : undefined!;

  const router = createTanStackRouter({
    routeTree,
    context: {
      auth,
    },
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
