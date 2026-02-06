import { buttonVariants } from "@filecase/ui";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { recentAuditActivityServerFn } from "../server/audit-fns";
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
  const showRecentActivity = user.role === "admin" || user.role === "manager";
  const recentActivityQuery = useQuery(
    queryOptions({
      queryKey: ["recent-audit-activity"],
      queryFn: () => recentAuditActivityServerFn(),
      enabled: showRecentActivity,
    }),
  );
  const recentActivity = recentActivityQuery.data ?? [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Filecase Dashboard</h1>
        <p className="text-muted-foreground">Firm: {user.firmName}</p>
        <p className="text-muted-foreground">Role: {user.role}</p>
      </header>

      <section className="flex items-center gap-3">
        <Link className={buttonVariants()} to="/clients">
          View Clients
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          to="/documents"
        >
          Search Documents
        </Link>
        {user.role === "admin" || user.role === "manager" ? (
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/admin/users"
            >
              Manage Assignments
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/audit"
            >
              Audit Log
            </Link>
          </>
        ) : null}
        <Link className={buttonVariants({ variant: "outline" })} to="/logout">
          Logout
        </Link>
      </section>

      {showRecentActivity ? (
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Recent Activity</h2>
            <Link className={buttonVariants({ size: "sm" })} to="/audit">
              Open Audit Log
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ul className="space-y-2">
              {recentActivity.map((event) => (
                <li className="text-sm" key={event.id}>
                  <span className="text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>{" "}
                  {event.actorName} - {event.summary}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}
