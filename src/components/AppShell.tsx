"use client";

import { ElectronMenu } from "@/components/ElectronMenu";
import clsx from "clsx";
import { BarChart3, ListTodo, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideTab = pathname.startsWith("/create") || pathname.startsWith("/settings");

  return (
    <div className="ios-app">
      <ElectronMenu />
      <div className="ios-screen">
        <div className={clsx("ios-body", !hideTab && "app-pad")}>{children}</div>
        {!hideTab && <TabBar pathname={pathname} />}
      </div>
    </div>
  );
}

function TabBar({ pathname }: { pathname: string }) {
  const todayActive = pathname === "/" || pathname.startsWith("/trackers/");
  const reportsActive = pathname.startsWith("/reports");

  return (
    <nav className="tab-bar border-t border-black/10 bg-[#f7f7f7]/95 backdrop-blur">
      <div className="relative mx-auto flex h-[52px] items-end justify-between px-10 pb-1">
        <Link
          href="/"
          aria-current={todayActive ? "page" : undefined}
          className={clsx(
            "flex flex-col items-center gap-0.5 rounded-lg px-3 pb-1 pt-1 transition-colors",
            todayActive ? "text-ios" : "text-muted hover:text-label",
          )}
        >
          <ListTodo size={24} strokeWidth={todayActive ? 2.4 : 2} />
          <span className="text-[10px] font-medium">Today</span>
        </Link>
        <Link
          href="/create"
          className="absolute left-1/2 top-[-18px] flex h-[56px] w-[56px] -translate-x-1/2 items-center justify-center rounded-full bg-ios text-white shadow-[0_8px_20px_rgba(0,122,255,0.45)] transition hover:bg-[#0066d6] active:scale-95"
          aria-label="Add tracker"
        >
          <Plus size={30} strokeWidth={2.6} />
        </Link>
        <Link
          href="/reports"
          aria-current={reportsActive ? "page" : undefined}
          className={clsx(
            "flex flex-col items-center gap-0.5 rounded-lg px-3 pb-1 pt-1 transition-colors",
            reportsActive ? "text-ios" : "text-muted hover:text-label",
          )}
        >
          <BarChart3 size={24} strokeWidth={reportsActive ? 2.4 : 2} />
          <span className="text-[10px] font-medium">Reports</span>
        </Link>
      </div>
    </nav>
  );
}
