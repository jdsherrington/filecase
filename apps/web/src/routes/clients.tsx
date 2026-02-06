import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { getCurrentUserServerFn } from "../server/auth/server-fns";

export const Route = createFileRoute("/clients")({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }

    if (location.pathname === "/clients" || location.pathname === "/clients/") {
      throw redirect({
        to: "/contacts",
      });
    }
  },
  component: ClientsRoutePage,
});

function ClientsRoutePage() {
  return <Outlet />;
}
