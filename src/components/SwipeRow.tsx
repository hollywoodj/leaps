"use client";

import { useRef, useState } from "react";

export function SwipeRow({
  children,
  enabled,
  onYes,
  onSkip,
}: {
  children: React.ReactNode;
  enabled: boolean;
  onYes: () => void;
  onSkip: () => void;
}) {
  const start = useRef(0);
  const [dx, setDx] = useState(0);
  const dragging = useRef(false);

  if (!enabled) return <>{children}</>;

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-good text-sm font-semibold text-white">
        Yes
      </div>
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-[#8e8e93] text-sm font-semibold text-white">
        Skip
      </div>
      <div
        className="relative bg-white"
        style={{ transform: `translateX(${dx}px)`, transition: dragging.current ? "none" : "transform 180ms ease" }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          dragging.current = true;
          start.current = e.clientX;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const next = Math.max(-120, Math.min(120, e.clientX - start.current));
          setDx(next);
        }}
        onPointerUp={() => {
          dragging.current = false;
          if (dx > 72) onYes();
          else if (dx < -72) onSkip();
          setDx(0);
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setDx(0);
        }}
      >
        {children}
      </div>
    </div>
  );
}
