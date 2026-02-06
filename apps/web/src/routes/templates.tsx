import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "../components/app-shell";
import { RecordsArea } from "../components/records-area";
import { getCurrentUserServerFn } from "../server/auth/server-fns";

export const Route = createFileRoute("/templates")({
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
  component: TemplatesRoutePage,
});

function TemplatesRoutePage() {
  const user = Route.useLoaderData();

  return (
    <AppShell user={user}>
      <RecordsArea mode="templates" />
    </AppShell>
  );
}
