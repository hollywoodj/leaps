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
      <div className="ios-screen relative">
        <div className={clsx(!hideTab && "app-pad")}>{children}</div>
        {!hideTab && <TabBar pathname={pathname} />}
      </div>
    </div>
  );
}

function TabBar({ pathname }: { pathname: string }) {
  const todayActive = pathname === "/" || pathname.startsWith("/trackers/");
  const reportsActive = pathname.startsWith("/reports");

  return (
    <nav className="tab-bar absolute inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#f7f7f7]/95 backdrop-blur">
      <div className="relative mx-auto flex h-[52px] max-w-lg items-end justify-between px-10 pb-1">
        <Link
          href="/"
          className={clsx("flex flex-col items-center gap-0.5 pb-1", todayActive ? "text-ios" : "text-muted")}
        >
          <ListTodo size={24} strokeWidth={todayActive ? 2.4 : 2} />
          <span className="text-[10px] font-medium">Today</span>
        </Link>
        <Link
          href="/create"
          className="absolute left-1/2 top-[-18px] flex h-[56px] w-[56px] -translate-x-1/2 items-center justify-center rounded-full bg-ios text-white shadow-[0_8px_20px_rgba(0,122,255,0.45)]"
          aria-label="Add tracker"
        >
          <Plus size={30} strokeWidth={2.6} />
        </Link>
        <Link
          href="/reports"
          className={clsx("flex flex-col items-center gap-0.5 pb-1", reportsActive ? "text-ios" : "text-muted")}
        >
          <BarChart3 size={24} strokeWidth={reportsActive ? 2.4 : 2} />
          <span className="text-[10px] font-medium">Reports</span>
        </Link>
      </div>
    </nav>
  );
}
