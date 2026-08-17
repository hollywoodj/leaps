"use client";

import clsx from "clsx";
import { BarChart3, CalendarCheck2, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Today", icon: CalendarCheck2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/create", label: "New", icon: Plus },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-stone-200/80 bg-white/70 px-5 py-8 backdrop-blur md:flex md:flex-col">
        <Link href="/" className="mb-10 px-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Leaps</div>
          <div className="mt-1 text-lg font-semibold tracking-tight">Goals & habits</div>
        </Link>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-teal/10 text-teal-dark" : "text-muted hover:bg-stone-100 hover:text-ink",
                )}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-2 text-xs leading-5 text-muted">
          Local SQLite on this machine. Nothing is stored in the browser.
        </p>
      </aside>

      <div className="app-pad mx-auto w-full max-w-3xl px-4 py-6 md:max-w-4xl md:px-8 md:py-10">
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white/90 px-6 py-2 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex flex-col items-center gap-1 px-3 py-1.5 text-[11px] font-medium",
                  active ? "text-teal" : "text-muted",
                )}
              >
                <span className={clsx("flex h-9 w-9 items-center justify-center rounded-full", link.href === "/create" && "bg-teal text-white")}>
                  <Icon size={link.href === "/create" ? 18 : 20} />
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
