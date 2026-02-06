import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  buttonVariants,
} from "@filecase/ui";
import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router";

import { getCurrentUserServerFn } from "../../../../server/auth/server-fns";
import { getEngagementOverviewServerFn } from "../../../../server/document-fns";

export const Route = createFileRoute(
  "/clients/$clientId/engagements/$engagementId",
)({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: EngagementOverviewRoutePage,
});

function EngagementOverviewRoutePage() {
  const { clientId, engagementId } = Route.useParams();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const routePath = `/clients/${clientId}/engagements/${engagementId}`;
  const isOverviewRoute = pathname === routePath || pathname === `${routePath}/`;

  if (!isOverviewRoute) {
    return <Outlet />;
  }

  return <EngagementOverviewPage />;
}

function EngagementOverviewPage() {
  const { clientId, engagementId } = Route.useParams();

  const overviewQuery = useQuery(
    queryOptions({
      queryKey: ["engagement-overview", clientId, engagementId],
      queryFn: () =>
        getEngagementOverviewServerFn({
          data: {
            clientId,
            engagementId,
          },
        }),
    }),
  );

  const overview = overviewQuery.data;

  if (!overview) {
    return (
      <p className="p-6 text-sm text-muted-foreground">Loading engagement...</p>
    );
  }

  const notFinalCount = overview.documentSummary
    .filter((entry) => entry.status !== "final")
    .reduce((total, entry) => total + entry.count, 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{overview.engagement.name}</h1>
          <p className="text-sm text-muted-foreground">
            FY {overview.engagement.financialYear} ·{" "}
            {overview.engagement.status}
          </p>
          <p className="text-sm text-muted-foreground">
            Due: {overview.engagement.dueDate ?? "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className={buttonVariants({ variant: "outline" })}
            params={{ clientId }}
            to="/clients/$clientId/engagements"
          >
            Back to Engagements
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            params={{ clientId, engagementId }}
            to="/clients/$clientId/engagements/$engagementId/documents"
          >
            View Not Final ({notFinalCount})
          </Link>
          <Link
            className={buttonVariants()}
            params={{ clientId, engagementId }}
            to="/clients/$clientId/engagements/$engagementId/documents/new"
          >
            Upload Document
          </Link>
        </div>
      </header>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-medium">Document Type Summary</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.documentSummary.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>No documents yet.</TableCell>
              </TableRow>
            ) : (
              overview.documentSummary.map((entry) => (
                <TableRow key={`${entry.documentType}-${entry.status}`}>
                  <TableCell>{entry.documentType}</TableCell>
                  <TableCell>{entry.status}</TableCell>
                  <TableCell>{entry.count}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 text-lg font-medium">Required Docs Checklist</h2>
        <p className="text-sm text-muted-foreground">
          Placeholder for an engagement-specific checklist. This will be
          expanded in a future task.
        </p>
      </section>
    </main>
  );
}
