import { buttonVariants, cn } from "@filecase/ui";
import { Link, useRouterState } from "@tanstack/react-router";

import type { AuthenticatedUser } from "../server/auth/session";

type AppShellProps = {
  user: AuthenticatedUser;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  to: "/" | "/documents" | "/clients" | "/admin/users" | "/audit";
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { label: "All Documents", to: "/" },
  { label: "Clients", to: "/clients" },
  { label: "Document Search", to: "/documents" },
  { label: "Team Assignments", to: "/admin/users", adminOnly: true },
  { label: "Audit Log", to: "/audit", adminOnly: true },
];

function isCurrentPath(pathname: string, route: string): boolean {
  if (route === "/") {
    return pathname === "/";
  }

  return pathname === route || pathname.startsWith(`${route}/`);
}

function roleLabel(role: AuthenticatedUser["role"]): string {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "manager") {
    return "Manager";
  }

  return "Staff";
}

export function AppShell({
  user,
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const showAdminLinks = user.role === "admin" || user.role === "manager";

  return (
    <div className="fc-app-shell">
      <aside className="fc-sidebar">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Firm
          </p>
          <h1 className="fc-display text-xl">{user.firmName}</h1>
        </div>

        <nav aria-label="Primary" className="mt-8 grid gap-2">
          {navItems
            .filter((item) => (item.adminOnly ? showAdminLinks : true))
            .map((item) => {
              const active = isCurrentPath(pathname, item.to);
              return (
                <Link
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fc-sidebar-active-bg)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--fc-sidebar-bg)]",
                    active
                      ? "bg-[color:var(--fc-sidebar-active-bg)] text-[color:var(--fc-sidebar-active-text)]"
                      : "text-muted-foreground hover:bg-[color:var(--fc-sidebar-hover-bg)] hover:text-foreground",
                  )}
                  key={item.to}
                  {...(active ? { "aria-current": "page" as const } : {})}
                  to={item.to}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="mt-auto rounded-2xl border border-[color:var(--fc-profile-border)] bg-[color:var(--fc-profile-bg)] p-4">
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {roleLabel(user.role)}
          </p>
          <Link
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-4 w-full",
            )}
            to="/logout"
          >
            Sign Out
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[color:var(--fc-content-border)] bg-[color:var(--fc-content-bg)] px-4 py-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-[1100px] items-start justify-between gap-4">
            <div>
              <h2 className="fc-display text-2xl leading-tight text-balance text-foreground">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </header>

        <nav
          aria-label="Mobile primary"
          className="fc-mobile-nav px-4 py-3 sm:px-6"
        >
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navItems
              .filter((item) => (item.adminOnly ? showAdminLinks : true))
              .map((item) => {
                const active = isCurrentPath(pathname, item.to);
                return (
                  <Link
                    className={cn(
                      "whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-[color:var(--fc-sidebar-active-text)] bg-[color:var(--fc-sidebar-active-bg)] text-[color:var(--fc-sidebar-active-text)]"
                        : "border-border text-muted-foreground",
                    )}
                    key={`${item.to}-mobile`}
                    to={item.to}
                  >
                    {item.label}
                  </Link>
                );
              })}
          </div>
        </nav>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10" id="main-content">
          <div className="mx-auto w-full max-w-[1100px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
