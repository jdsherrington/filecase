import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  buttonVariants,
  cn,
} from "@filecase/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { AuthenticatedUser } from "../server/auth/session";

type AppShellProps = {
  user: AuthenticatedUser;
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  to: "/" | "/templates" | "/internal" | "/contacts";
  icon: (props: { className?: string }) => React.JSX.Element;
};

const SIDEBAR_COLLAPSED_STORAGE_KEY = "filecase.sidebar.collapsed";

function FilecaseLogoMark({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        fill="var(--fc-sidebar-active-bg)"
        height="34"
        rx="10"
        width="34"
        x="1"
        y="1"
      />
      <path
        d="M9 12.25H27M9 18H22M9 23.75H17"
        stroke="var(--fc-sidebar-active-text)"
        strokeLinecap="round"
        strokeWidth="2.3"
      />
    </svg>
  );
}

function RecordsIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 7.5H18M6 12H18M6 16.5H13.5M4.75 4.75H19.25V19.25H4.75V4.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TemplatesIcon({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 4.75H19.25V16.5H7.5V4.75ZM4.75 7.5H16.5V19.25H4.75V7.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function InternalIcon({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3.75L19.25 8V16L12 20.25L4.75 16V8L12 3.75ZM12 9V15M9 12H15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ContactsIcon({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12.5C13.933 12.5 15.5 10.933 15.5 9C15.5 7.067 13.933 5.5 12 5.5C10.067 5.5 8.5 7.067 8.5 9C8.5 10.933 10.067 12.5 12 12.5ZM6 18.25C6.85 15.95 9.15 14.5 12 14.5C14.85 14.5 17.15 15.95 18 18.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12.25C13.933 12.25 15.5 10.683 15.5 8.75C15.5 6.817 13.933 5.25 12 5.25C10.067 5.25 8.5 6.817 8.5 8.75C8.5 10.683 10.067 12.25 12 12.25ZM6.25 18.75C7.117 16.45 9.267 15 12 15C14.733 15 16.883 16.45 17.75 18.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CollapseIcon({
  className,
  collapsed,
}: {
  className?: string;
  collapsed: boolean;
}): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={collapsed ? "M9 6L15 12L9 18" : "M15 6L9 12L15 18"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

const navItems: NavItem[] = [
  { label: "Records", to: "/", icon: RecordsIcon },
  { label: "Templates", to: "/templates", icon: TemplatesIcon },
  { label: "Internal", to: "/internal", icon: InternalIcon },
  { label: "Contacts", to: "/contacts", icon: ContactsIcon },
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return (
        window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true"
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY,
        String(isSidebarCollapsed),
      );
    } catch {
      // Ignore storage errors and keep UI functional.
    }
  }, [isSidebarCollapsed]);

  return (
    <div className="fc-app-shell">
      <aside
        className={cn(
          "fc-sidebar",
          isSidebarCollapsed && "fc-sidebar-collapsed",
        )}
      >
        <div
          className={cn(
            "flex min-h-14 items-center gap-3",
            isSidebarCollapsed ? "justify-center" : "",
          )}
        >
          <Link
            aria-label="Go to records"
            className={cn(
              "group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSidebarCollapsed
                ? "h-11 w-11 justify-center"
                : "min-w-0 justify-start",
            )}
            to="/"
          >
            <FilecaseLogoMark className="h-9 w-9 flex-none" />
            {!isSidebarCollapsed ? (
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Filecase
                </p>
                <h1 className="fc-display truncate text-xl text-foreground">
                  {user.firmName}
                </h1>
              </div>
            ) : (
              <span className="sr-only">Filecase</span>
            )}
          </Link>
        </div>

        <nav aria-label="Primary" className="mt-8 grid gap-2">
          {navItems.map((item) => {
            const active = isCurrentPath(pathname, item.to);
            return (
              <Link
                aria-label={isSidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSidebarCollapsed ? "justify-center px-0" : "justify-start",
                  active
                    ? "bg-[color:var(--fc-sidebar-active-bg)] text-[color:var(--fc-sidebar-active-text)]"
                    : "text-muted-foreground hover:bg-[color:var(--fc-sidebar-hover-bg)] hover:text-foreground",
                )}
                key={item.to}
                {...(active ? { "aria-current": "page" as const } : {})}
                to={item.to}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isSidebarCollapsed ? (
                  <span>{item.label}</span>
                ) : (
                  <span className="sr-only">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "mt-auto flex flex-col gap-3",
            isSidebarCollapsed ? "items-center" : "",
          )}
        >
          <button
            aria-label={
              isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--fc-profile-border)] bg-[color:var(--fc-profile-bg)] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            type="button"
          >
            <CollapseIcon className="h-4 w-4" collapsed={isSidebarCollapsed} />
          </button>

          {isSidebarCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center self-center rounded-xl border border-[color:var(--fc-profile-border)] bg-[color:var(--fc-profile-bg)] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  type="button"
                >
                  <ProfileIcon className="h-5 w-5" />
                  <span className="sr-only">Account</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56" side="right">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {user.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/internal">Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/logout">Sign Out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="rounded-2xl border border-[color:var(--fc-profile-border)] bg-[color:var(--fc-profile-bg)] p-4">
              <p className="text-sm font-semibold text-foreground">
                {user.name}
              </p>
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
          )}
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
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
