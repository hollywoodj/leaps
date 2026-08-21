"use client";

import clsx from "clsx";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function NavHeader({
  title,
  subtitle,
  left,
  right,
  menu,
  tabs,
  activeTab,
  onTab,
  children,
}: {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  menu?: { href: string; label: string }[];
  tabs?: string[];
  activeTab?: string;
  onTab?: (tab: string) => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="navy-bar sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
      <div className="relative flex h-12 items-center px-2">
        <div className="absolute left-1 z-10 flex items-center">{left}</div>
        <div className="mx-auto flex min-w-0 max-w-[calc(100%-6.5rem)] flex-col items-center text-center">
          {menu ? (
            <button type="button" onClick={() => setOpen((v) => !v)} className="flex max-w-full items-center gap-1">
              <span className="truncate text-[17px] font-semibold tracking-tight">{title}</span>
              <ChevronDown size={16} strokeWidth={2.4} className="shrink-0" />
            </button>
          ) : (
            <div className="max-w-full truncate text-[17px] font-semibold tracking-tight">{title}</div>
          )}
          {subtitle && <div className="max-w-full truncate text-[11px] font-medium text-white/80">{subtitle}</div>}
        </div>
        <div className="absolute right-1 z-10 flex items-center">{right}</div>
        {open && menu && (
          <>
            <button type="button" className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-label="Close menu" />
            <div className="absolute left-1/2 top-11 z-50 w-44 -translate-x-1/2 overflow-hidden rounded-xl bg-white py-1 text-label shadow-card">
              {menu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "block px-4 py-2.5 text-left text-[15px]",
                    item.label === title ? "font-semibold text-ios" : "text-label",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      {tabs && (
        <div className="px-3 pb-2.5">
          <div className="flex rounded-lg bg-black/15 p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTab?.(tab)}
                className={clsx(
                  "min-w-0 flex-1 truncate rounded-md px-1 py-1.5 text-[13px] font-semibold",
                  activeTab === tab ? "bg-white text-navy" : "text-white/90",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}
      {children}
    </header>
  );
}

export function HeaderButton({
  children,
  onClick,
  href,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  label: string;
}) {
  const className =
    "flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10";
  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      {children}
    </button>
  );
}
