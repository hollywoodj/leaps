"use client";

import clsx from "clsx";
import Link from "next/link";
import { Check, ChevronDown, ChevronLeft } from "lucide-react";
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
      <div className="relative flex h-11 items-center px-1">
        <div className="absolute left-0 z-10 flex items-center">{left}</div>
        <div className="mx-auto flex min-w-0 max-w-[calc(100%-7.5rem)] flex-col items-center text-center">
          {menu ? (
            <button type="button" onClick={() => setOpen((v) => !v)} className="flex max-w-full items-center gap-0.5 press">
              <span className="truncate text-[17px] font-semibold tracking-tight">{title}</span>
              <ChevronDown size={13} strokeWidth={3} className="shrink-0 opacity-90" />
            </button>
          ) : (
            <div className="max-w-full truncate text-[17px] font-semibold tracking-tight">{title}</div>
          )}
          {subtitle && <div className="max-w-full truncate text-[11px] font-medium text-white/80">{subtitle}</div>}
        </div>
        <div className="absolute right-0 z-10 flex items-center">{right}</div>
        {open && menu && (
          <>
            <button type="button" className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-label="Close menu" />
            <div className="absolute left-1/2 top-[42px] z-50 w-48 -translate-x-1/2 overflow-hidden rounded-[13px] bg-white/95 py-1 text-label shadow-card backdrop-blur">
              {menu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 text-left text-[15px] press"
                >
                  <span className={item.label === title ? "font-semibold text-ios" : "text-label"}>{item.label}</span>
                  {item.label === title && <Check size={16} strokeWidth={2.6} className="text-ios" />}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      {tabs && (
        <div className="px-3 pb-2.5">
          <div className="seg-ios">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-selected={activeTab === tab}
                className={clsx(activeTab === tab && "is-on")}
                onClick={() => onTab?.(tab)}
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
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  label: string;
  active?: boolean;
}) {
  const className = clsx(
    "flex h-11 w-11 items-center justify-center rounded-full text-white press",
    active && "bg-white/15",
  );
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

export function BackButton({ href, label, onClick }: { href?: string; label: string; onClick?: () => void }) {
  const className = "flex h-11 items-center text-white press -ml-0.5 pr-2";
  const inner = (
    <>
      <ChevronLeft size={28} strokeWidth={2.15} className="-mr-1" />
      <span className="text-[17px]">{label}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} aria-label={label}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={href || "/"} className={className} aria-label={label}>
      {inner}
    </Link>
  );
}
