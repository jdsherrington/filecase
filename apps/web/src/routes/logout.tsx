import { createFileRoute, redirect } from "@tanstack/react-router";

import { logoutServerFn } from "../server/auth/server-fns";

export const Route = createFileRoute("/logout")({
  beforeLoad: async () => {
    await logoutServerFn();

    throw redirect({
      to: "/login",
    });
  },
  component: LogoutPage,
});

function LogoutPage() {
  return <p className="p-6 text-sm text-muted-foreground">Signing out...</p>;
}
