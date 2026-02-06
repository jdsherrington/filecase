import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "../components/app-shell";
import { DocumentsExplorer } from "../components/documents-explorer";
import { getCurrentUserServerFn } from "../server/auth/server-fns";

export const Route = createFileRoute("/")({
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
  component: DashboardPage,
});

function DashboardPage() {
  const user = Route.useLoaderData();

  return (
    <AppShell
      description="All documents across every client and engagement in your firm."
      title="Document Workspace"
      user={user}
    >
      <DocumentsExplorer />
    </AppShell>
  );
}
