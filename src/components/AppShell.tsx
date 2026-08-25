"use client";

import { ElectronMenu } from "@/components/ElectronMenu";
import clsx from "clsx";
import { BarChart3, Plus, SquareCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideTab =
    pathname.startsWith("/create") || pathname.startsWith("/settings") || pathname.startsWith("/trackers/");

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
  const todayActive = pathname === "/";
  const reportsActive = pathname.startsWith("/reports");

  return (
    <nav className="tab-bar">
      <div className="relative mx-auto flex h-[49px] items-end justify-between px-8 pb-[3px]">
        <Link
          href="/"
          aria-current={todayActive ? "page" : undefined}
          className={clsx(
            "flex min-w-[72px] flex-col items-center gap-0.5 rounded-md px-2 pt-1 press",
            todayActive ? "text-ios" : "text-muted",
          )}
        >
          <SquareCheck size={24} strokeWidth={todayActive ? 2.4 : 1.85} />
          <span className="text-[10px] font-medium leading-tight">Daily Goals</span>
        </Link>
        <Link
          href="/create"
          className="absolute left-1/2 top-[-22px] flex h-[58px] w-[58px] -translate-x-1/2 items-center justify-center rounded-full bg-ios text-white shadow-[0_6px_16px_rgba(0,122,255,0.38)] transition hover:bg-[#0066d6] active:scale-95"
          aria-label="Add tracker"
        >
          <Plus size={32} strokeWidth={2.4} />
        </Link>
        <Link
          href="/reports"
          aria-current={reportsActive ? "page" : undefined}
          className={clsx(
            "flex min-w-[72px] flex-col items-center gap-0.5 rounded-md px-2 pt-1 press",
            reportsActive ? "text-ios" : "text-muted",
          )}
        >
          <BarChart3 size={24} strokeWidth={reportsActive ? 2.4 : 1.85} />
          <span className="text-[10px] font-medium leading-tight">Reports</span>
        </Link>
      </div>
    </nav>
  );
}
