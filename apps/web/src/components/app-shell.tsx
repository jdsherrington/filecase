import { buttonVariants, cn } from "@filecase/ui";
import { Link, useRouterState } from "@tanstack/react-router";

import type { AuthenticatedUser } from "../server/auth/session";

type AppShellProps = {
  user: AuthenticatedUser;
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  to: "/" | "/templates" | "/internal" | "/contacts";
};

const navItems: NavItem[] = [
  { label: "Records", to: "/" },
  { label: "Templates", to: "/templates" },
  { label: "Internal", to: "/internal" },
  { label: "Contacts", to: "/contacts" },
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

export function AppShell({ user, children }: AppShellProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <div className="fc-app-shell">
      <aside className="fc-sidebar">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Filecase
          </p>
          <h1 className="fc-display text-xl text-foreground">{user.firmName}</h1>
        </div>

        <nav aria-label="Primary" className="mt-8 grid gap-2">
          {navItems.map((item) => {
            const active = isCurrentPath(pathname, item.to);
            return (
              <Link
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
          <p className="mt-2 text-xs text-muted-foreground">{roleLabel(user.role)}</p>
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
        <nav
          aria-label="Mobile primary"
          className="fc-mobile-nav border-b border-[color:var(--fc-content-border)] px-4 py-3 sm:px-6"
        >
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
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
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
