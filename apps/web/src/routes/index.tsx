import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

import { AppShell } from "../components/app-shell";
import { getCurrentUserServerFn } from "../server/auth/server-fns";

type RecordsSearch = {
  contactId?: string;
};

const LazyRecordsArea = lazy(async () => {
  const module = await import("../components/records-area");
  return { default: module.RecordsArea };
});

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): RecordsSearch => ({
    contactId:
      typeof search.contactId === "string" && search.contactId.length > 0
        ? search.contactId
        : undefined,
  }),
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
  component: RecordsRoutePage,
});

function RecordsRoutePage() {
  const user = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <AppShell user={user}>
      <Suspense
        fallback={
          <div className="fc-records-shell">
            <div className="flex min-h-[320px] items-center justify-center rounded-md border border-border bg-secondary/30 text-sm text-muted-foreground">
              Loading records...
            </div>
          </div>
        }
      >
        <LazyRecordsArea mode="records" presetClientId={search.contactId} />
      </Suspense>
    </AppShell>
  );
}
