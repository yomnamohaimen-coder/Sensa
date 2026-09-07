"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useSyncExternalStore,
  type ReactElement,
  type SVGProps,
} from "react";
import { createClient } from "@/utils/supabase/client";

const SIDEBAR_STORAGE_KEY = "sensa-sidebar-collapsed";

const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(listener: () => void) {
  collapsedListeners.add(listener);
  return () => {
    collapsedListeners.delete(listener);
  };
}

function readCollapsed() {
  try {
    return sessionStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/** Server render and hydration always start expanded; storage applies after. */
function readCollapsedOnServer() {
  return false;
}

function writeCollapsed(next: boolean) {
  try {
    sessionStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
  } catch {
    // sessionStorage unavailable — collapse still applies for this render.
  }
  for (const listener of collapsedListeners) {
    listener();
  }
}

type NavItem = {
  href: string;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
};

function IconBase({
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </IconBase>
  );
}

function ReportsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M9 3h6l3 3v15H6V3h3z" />
      <path d="M9 3v3h6" />
      <path d="M9 13h6M9 17h4" />
    </IconBase>
  );
}

function HeatmapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function SessionRecordingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9.5v5l4.5-2.5L10 9.5z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function ConnectIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </IconBase>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </IconBase>
  );
}

function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </IconBase>
  );
}

function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M15 18l-6-6 6-6" />
    </IconBase>
  );
}

function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M9 18l6-6-6-6" />
    </IconBase>
  );
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/reports", label: "Reports", Icon: ReportsIcon },
  { href: "/heatmap", label: "Heatmap", Icon: HeatmapIcon },
  {
    href: "/session-recordings",
    label: "Session Recordings",
    Icon: SessionRecordingsIcon,
  },
  { href: "/connect", label: "Connect", Icon: ConnectIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

function navLinkClassName(isActive: boolean, collapsed: boolean) {
  return [
    "flex min-h-11 items-center rounded-md text-sm font-medium transition-colors",
    collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
    isActive
      ? "bg-raised text-ink"
      : "text-ink-secondary hover:bg-canvas hover:text-ink",
  ].join(" ");
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    readCollapsedOnServer,
  );

  function toggleCollapsed() {
    writeCollapsed(!collapsed);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden border-r border-hairline bg-surface transition-[width] duration-200 ease-out ${
        collapsed ? "w-14" : "w-56"
      }`}
      aria-label="Main navigation"
    >
      <div
        className={`flex shrink-0 items-center border-b border-hairline ${
          collapsed ? "justify-center px-2 py-4" : "justify-between gap-2 px-3 py-4"
        }`}
      >
        <Link
          href="/dashboard"
          className={`font-semibold tracking-tight text-ink ${
            collapsed ? "text-base" : "truncate text-lg"
          }`}
          title="Sensa"
        >
          {collapsed ? "S" : "Sensa"}
        </Link>

        {!collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar-nav"
            aria-label="Collapse sidebar"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {collapsed ? (
        <div className="flex justify-center px-2 py-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar-nav"
            aria-label="Expand sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <nav
        id="app-sidebar-nav"
        className={`flex flex-1 flex-col gap-1 py-2 ${collapsed ? "px-2" : "px-3"}`}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={navLinkClassName(isActive, collapsed)}
            >
              <item.Icon className="h-5 w-5 shrink-0" />
              <span className={collapsed ? "sr-only" : "truncate"}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className={`shrink-0 border-t border-hairline py-3 ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          className={`${navLinkClassName(false, collapsed)} w-full`}
        >
          <LogOutIcon className="h-5 w-5 shrink-0" />
          <span className={collapsed ? "sr-only" : "truncate"}>Log out</span>
        </button>
      </div>
    </aside>
  );
}
