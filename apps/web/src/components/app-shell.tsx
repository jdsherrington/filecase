import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@filecase/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building,
  Contact2,
  FileStack,
  FileText,
  PanelLeft,
  PanelLeftClose,
  Settings,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import type { AuthenticatedUser } from "../server/auth/session";

type AppShellProps = {
  user: AuthenticatedUser;
  firmOptions?: FirmOption[];
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  to: "/" | "/templates" | "/internal" | "/contacts";
  icon: LucideIcon;
};

type FirmOption = {
  id: string;
  name: string;
};

const SIDEBAR_COLLAPSED_STORAGE_KEY = "filecase.sidebar.collapsed";

const navItems: NavItem[] = [
  { label: "Records", to: "/", icon: FileText },
  { label: "Templates", to: "/templates", icon: FileStack },
  { label: "Internal", to: "/internal", icon: Building },
  { label: "Contacts", to: "/contacts", icon: Contact2 },
];

function isCurrentPath(pathname: string, route: string): boolean {
  if (route === "/") {
    return pathname === "/";
  }

  return pathname === route || pathname.startsWith(`${route}/`);
}

function LogoMark({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.25 9.5L12 5.75L18.75 9.5L12 13.25L5.25 9.5Z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M5.25 9.5V16.25L12 20L18.75 16.25V9.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 11.5V15.25L12 17.25L15.5 15.25V11.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M10.5 12L12 12.85L13.5 12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part.slice(0, 1).toUpperCase()).join("");
  return initials || "FC";
}

function AccountMenuItems({ user }: { user: AuthenticatedUser }) {
  return (
    <>
      <DropdownMenuLabel>
        <p className="text-sm font-semibold">{user.name}</p>
        <p className="text-xs font-normal text-muted-foreground">
          {user.email}
        </p>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/internal">Account Settings</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/logout">Sign out</Link>
      </DropdownMenuItem>
    </>
  );
}

export function AppShell({
  user,
  firmOptions,
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const fromDocument = document.documentElement.dataset.fcSidebarCollapsed;
    if (fromDocument === "true") {
      return true;
    }

    if (fromDocument === "false") {
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

  const [selectedFirmId, setSelectedFirmId] = useState(user.firmId);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY,
        String(isSidebarCollapsed),
      );
      document.documentElement.dataset.fcSidebarCollapsed = isSidebarCollapsed
        ? "true"
        : "false";
    } catch {
      // Ignore storage errors and keep UI functional.
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setSelectedFirmId(user.firmId);
  }, [user.firmId]);

  const availableFirmOptions =
    firmOptions && firmOptions.length > 0
      ? firmOptions
      : [
          {
            id: user.firmId,
            name: user.firmName,
          },
        ];
  const hasMultipleFirms = availableFirmOptions.length > 1;

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
            "fc-sidebar-top",
            isSidebarCollapsed && "justify-center",
          )}
        >
          {isSidebarCollapsed ? (
            <button
              aria-label="Expand sidebar"
              className="fc-collapse-button"
              onClick={() => setIsSidebarCollapsed(false)}
              type="button"
            >
              <PanelLeft className="size-4" />
            </button>
          ) : (
            <>
              <Link aria-label="Go to records" className="fc-brand-link" to="/">
                <LogoMark className="size-8 shrink-0" />
                <span className="truncate text-lg font-semibold tracking-tight text-foreground">
                  Filecase
                </span>
              </Link>
              <button
                aria-label="Collapse sidebar"
                className="fc-collapse-button"
                onClick={() => setIsSidebarCollapsed(true)}
                type="button"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </>
          )}
        </div>

        <nav aria-label="Primary" className="fc-sidebar-nav">
          {navItems.map((item) => {
            const active = isCurrentPath(pathname, item.to);
            const Icon = item.icon;

            return (
              <Link
                aria-label={isSidebarCollapsed ? item.label : undefined}
                className={cn(
                  "fc-nav-item",
                  isSidebarCollapsed && "fc-nav-item-collapsed",
                  active && "fc-nav-item-active",
                )}
                key={item.to}
                {...(active ? { "aria-current": "page" as const } : {})}
                to={item.to}
              >
                <Icon className="size-[1.125rem] shrink-0" />
                {!isSidebarCollapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "fc-sidebar-bottom",
            isSidebarCollapsed
              ? "fc-sidebar-bottom-collapsed"
              : "fc-sidebar-bottom-expanded",
          )}
        >
          <Dialog>
            <DialogTrigger asChild>
              <button
                aria-label="Open settings"
                className={cn(
                  "fc-sidebar-settings",
                  isSidebarCollapsed && "fc-sidebar-settings-collapsed",
                )}
                type="button"
              >
                <Settings className="size-4 shrink-0" />
                {!isSidebarCollapsed ? <span>Settings</span> : null}
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription>
                  Open account and workspace settings.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Link className="fc-modal-link" to="/internal">
                  Account Settings
                </Link>
              </div>
            </DialogContent>
          </Dialog>

          <div aria-hidden="true" className="fc-sidebar-separator" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Profile menu"
                className={cn(
                  "fc-profile-trigger",
                  isSidebarCollapsed && "fc-profile-trigger-collapsed",
                )}
                type="button"
              >
                <span className="fc-profile-avatar" aria-hidden="true">
                  {initialsFromName(user.name)}
                </span>
                {!isSidebarCollapsed ? (
                  <span className="fc-profile-name" title={user.name}>
                    {user.name}
                  </span>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isSidebarCollapsed ? "start" : "end"}
              className="w-56"
              side={isSidebarCollapsed ? "right" : "top"}
            >
              <AccountMenuItems user={user} />
            </DropdownMenuContent>
          </DropdownMenu>

          {!isSidebarCollapsed ? (
            hasMultipleFirms ? (
              <Select value={selectedFirmId} onValueChange={setSelectedFirmId}>
                <SelectTrigger
                  aria-label="Tenant"
                  className="fc-tenant-select-trigger"
                  id="tenant-switcher"
                >
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {availableFirmOptions.map((firm) => (
                    <SelectItem key={firm.id} value={firm.id}>
                      {firm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="fc-tenant-label">{availableFirmOptions[0]?.name}</p>
            )
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav aria-label="Mobile primary" className="fc-mobile-nav">
          <div className="flex items-center gap-2 overflow-x-auto">
            {navItems.map((item) => {
              const active = isCurrentPath(pathname, item.to);
              const Icon = item.icon;

              return (
                <Link
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium whitespace-nowrap",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground",
                  )}
                  key={`${item.to}-mobile`}
                  to={item.to}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Profile menu"
                className="fc-mobile-profile"
                type="button"
              >
                <UserRound className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <AccountMenuItems user={user} />
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8" id="main-content">
          {title || description || actions ? (
            <header className="mb-6 border-b border-[color:var(--fc-content-border)] pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  {title ? (
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {title}
                    </h1>
                  ) : null}
                  {description ? (
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
                {actions ? <div>{actions}</div> : null}
              </div>
            </header>
          ) : null}
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
