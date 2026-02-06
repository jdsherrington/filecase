import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "../../components/app-shell";
import { DocumentsExplorer } from "../../components/documents-explorer";
import { getCurrentUserServerFn } from "../../server/auth/server-fns";

export const Route = createFileRoute("/documents/")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    return user;
  },
  component: GlobalDocumentsPage,
});

function GlobalDocumentsPage() {
  const user = Route.useLoaderData();

  return (
    <AppShell
      description="Search and filter every document available to your role."
      title="Document Search"
      user={user}
    >
      <DocumentsExplorer />
    </AppShell>
  );
}
