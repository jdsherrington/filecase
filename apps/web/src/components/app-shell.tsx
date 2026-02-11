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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@filecase/ui";
import { Link, useMatchRoute, useRouterState } from "@tanstack/react-router";
import {
  Contact2,
  Copy,
  FileText,
  PanelLeft,
  PanelLeftClose,
  Settings,
  UserRound,
  Waypoints,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import type { AuthenticatedUser } from "../server/auth/session";

type AppShellProps = {
  user: AuthenticatedUser;
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

const SIDEBAR_COLLAPSED_STORAGE_KEY = "filecase.sidebar.collapsed";

const navItems: NavItem[] = [
  { label: "Records", to: "/", icon: FileText },
  { label: "Templates", to: "/templates", icon: Copy },
  { label: "Internal", to: "/internal", icon: Waypoints },
  { label: "Contacts", to: "/contacts", icon: Contact2 },
];

function LogoMark({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 30 41"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M22 15H18V28H22V41H4V28H0V15H1V11H4V0H22V15ZM11 34V35H15V34H11ZM11 31V33H15V31H11ZM7 21V22H11V21H7ZM7 18V20H11V18H7ZM2 12V15H15V13H6V12H2ZM11 8V9H15V8H11ZM11 5V7H15V5H11ZM5 1V2H21V1H5Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <path d="M30 0H28V41H30V0Z" fill="currentColor" />
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
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  const hasPendingMatches = useRouterState({
    select: (state) => Boolean(state.pendingMatches?.length),
  });
  const matchRoute = useMatchRoute();

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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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

  const isRouteActive = (route: NavItem["to"]): boolean => {
    const fuzzy = route !== "/";

    if (hasPendingMatches) {
      return Boolean(
        matchRoute({
          to: route,
          pending: true,
          fuzzy,
          includeSearch: false,
        }),
      );
    }

    return Boolean(
      matchRoute({
        to: route,
        fuzzy,
        includeSearch: false,
      }),
    );
  };

  return (
    <div className="fc-app-shell">
      <aside
        className={cn(
          "fc-sidebar",
          isSidebarCollapsed && "fc-sidebar-collapsed",
        )}
      >
        <TooltipProvider delayDuration={1000}>
          <div className="fc-sidebar-main">
            <div
              className="fc-sidebar-top"
            >
              <Link aria-label="Go to records" className="fc-brand-link" to="/">
                <span aria-hidden="true" className="fc-brand-mark">
                  <LogoMark className="size-full" />
                </span>
                <span className="fc-brand-text">Filecase</span>
              </Link>
              <button
                aria-label={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
                className="fc-collapse-button"
                type="button"
                onClick={(event) => {
                  setIsSidebarCollapsed((current) => !current);
                  event.currentTarget.blur();
                }}
              >
                {isSidebarCollapsed ? (
                  <PanelLeft className="size-[18px]" />
                ) : (
                  <PanelLeftClose className="size-[18px]" />
                )}
              </button>
            </div>

            <nav aria-label="Primary" className="fc-sidebar-nav">
              {navItems.map((item) => {
                const active = isRouteActive(item.to);
                const Icon = item.icon;

                const navLink = (
                  <Link
                    aria-label={isSidebarCollapsed ? item.label : undefined}
                    className={cn(
                      "fc-nav-item",
                      active && "fc-nav-item-active",
                    )}
                    {...(active ? { "aria-current": "page" as const } : {})}
                    to={item.to}
                  >
                    <span className="fc-nav-icon" aria-hidden="true">
                      <Icon className="size-full" />
                    </span>
                    <span className="fc-nav-label">{item.label}</span>
                  </Link>
                );

                return (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                    <TooltipContent
                      className={cn(!isSidebarCollapsed && "hidden")}
                      side="right"
                      sideOffset={5}
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          <div className="fc-sidebar-bottom">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <button
                  aria-label="Open settings"
                  aria-expanded={settingsOpen}
                  className={cn(
                    "fc-nav-item fc-sidebar-settings",
                    settingsOpen && "fc-nav-item-active",
                  )}
                  type="button"
                >
                  <span className="fc-nav-icon" aria-hidden="true">
                    <Settings className="size-full" />
                  </span>
                  <span className="fc-sidebar-settings-label">Settings</span>
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

            <DropdownMenu
              open={profileMenuOpen}
              onOpenChange={setProfileMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Profile menu"
                  className={cn(
                    "fc-nav-item fc-profile-trigger",
                    profileMenuOpen && "fc-nav-item-active",
                  )}
                  type="button"
                >
                  <span className="fc-profile-avatar" aria-hidden="true">
                    {initialsFromName(user.name)}
                  </span>
                  <span className="fc-profile-name" title={user.name}>
                    {user.name}
                  </span>
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
          </div>
        </TooltipProvider>
      </aside>

      <div className="fc-main-shell">
        <nav aria-label="Mobile primary" className="fc-mobile-nav">
          <div className="fc-mobile-nav-list">
            {navItems.map((item) => {
              const active = isRouteActive(item.to);
              const Icon = item.icon;

              return (
                <Link
                  className={cn(
                    "fc-mobile-nav-item",
                    active && "fc-mobile-nav-item-active",
                  )}
                  key={`${item.to}-mobile`}
                  to={item.to}
                >
                  <Icon className="size-[14px]" />
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
                <UserRound className="size-[14px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <AccountMenuItems user={user} />
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <main className="fc-main-content" id="main-content">
          {title || description || actions ? (
            <header className="fc-page-header">
              <div className="fc-page-header-row">
                <div className="space-y-1">
                  {title ? <h1 className="fc-page-title">{title}</h1> : null}
                  {description ? (
                    <p className="fc-page-description">{description}</p>
                  ) : null}
                </div>
                {actions ? <div>{actions}</div> : null}
              </div>
            </header>
          ) : null}
          <div className="fc-page-body">{children}</div>
        </main>
      </div>
    </div>
  );
}
