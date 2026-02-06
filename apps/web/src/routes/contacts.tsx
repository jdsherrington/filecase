import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "../components/app-shell";
import { ContactsArea } from "../components/contacts-area";
import { getCurrentUserServerFn } from "../server/auth/server-fns";

export const Route = createFileRoute("/contacts")({
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
  component: ContactsRoutePage,
});

function ContactsRoutePage() {
  const user = Route.useLoaderData();

  return (
    <AppShell user={user}>
      <ContactsArea />
    </AppShell>
  );
}
