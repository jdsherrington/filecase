import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

import { AppShell } from "../components/app-shell";
import { getCurrentUserServerFn } from "../server/auth/server-fns";

const LazyRecordsArea = lazy(async () => {
  const module = await import("../components/records-area");
  return { default: module.RecordsArea };
});

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
      <Suspense
        fallback={
          <div className="fc-records-shell">
            <div className="flex min-h-[320px] items-center justify-center rounded-md border border-border bg-secondary/30 text-sm text-muted-foreground">
              Loading internal records...
            </div>
          </div>
        }
      >
        <LazyRecordsArea mode="internal" />
      </Suspense>
    </AppShell>
  );
}
