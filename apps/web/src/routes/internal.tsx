import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "../components/app-shell";
import { RecordsArea } from "../components/records-area";
import { getCurrentUserServerFn } from "../server/auth/server-fns";

export const Route = createFileRoute("/internal")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
  },
  loader: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }

    return user;
  },
  component: InternalRoutePage,
});

function InternalRoutePage() {
  const user = Route.useLoaderData();

  return (
    <AppShell user={user}>
      <RecordsArea mode="internal" />
    </AppShell>
  );
}
