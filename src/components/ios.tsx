"use client";

import clsx from "clsx";

export function IosSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx("ios-switch", checked && "on")}
    >
      <span className="ios-switch-knob" />
    </button>
  );
}

export function IosSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16" role="status" aria-label={label}>
      <span className="ios-spinner" />
      <p className="mt-3 text-[13px] text-muted">{label}…</p>
    </div>
  );
}

export function IosGrabber() {
  return <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-black/18" aria-hidden />;
}

export function FilterPopover({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/15" aria-label="Close filter" onClick={onClose} />
      <div className="absolute right-1 top-11 z-50 w-[220px] overflow-hidden rounded-[14px] bg-white/95 py-1.5 text-label shadow-card backdrop-blur">
        {children}
      </div>
    </>
  );
}

export function FilterItem({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[15px] press"
    >
      <span className="flex items-center gap-2">
        {color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
        {children}
      </span>
      {active && <span className="text-[15px] font-semibold text-ios">✓</span>}
    </button>
  );
}
