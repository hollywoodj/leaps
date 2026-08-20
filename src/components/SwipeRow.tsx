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
  const startX = useRef(0);
  const startY = useRef(0);
  const pointerId = useRef<number | null>(null);
  const tracking = useRef(false);
  const [dx, setDx] = useState(0);
  const dragging = useRef(false);
  const axis = useRef<"h" | "v" | null>(null);

  if (!enabled) return <>{children}</>;

  function reset() {
    tracking.current = false;
    pointerId.current = null;
    dragging.current = false;
    axis.current = null;
    setDx(0);
  }

  function isCurrentPointer(id: number) {
    return tracking.current && pointerId.current === id;
  }

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-good text-sm font-semibold text-white">
        Yes
      </div>
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-[#8e8e93] text-sm font-semibold text-white">
        Skip
      </div>
      <div
        className="relative bg-white touch-pan-y"
        style={{ transform: `translateX(${dx}px)`, transition: dragging.current ? "none" : "transform 180ms ease" }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("a, button, input, textarea, select")) return;
          if (e.pointerType === "mouse" && e.button !== 0) return;
          tracking.current = true;
          pointerId.current = e.pointerId;
          startX.current = e.clientX;
          startY.current = e.clientY;
          axis.current = null;
          dragging.current = false;
        }}
        onPointerMove={(e) => {
          if (!isCurrentPointer(e.pointerId)) return;
          const mx = e.clientX - startX.current;
          const my = e.clientY - startY.current;
          if (!axis.current) {
            if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
            axis.current = Math.abs(mx) > Math.abs(my) ? "h" : "v";
            if (axis.current === "h") {
              dragging.current = true;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }
          }
          if (axis.current === "h") setDx(Math.max(-120, Math.min(120, mx)));
        }}
        onPointerUp={(e) => {
          if (!isCurrentPointer(e.pointerId)) return;
          const finalDx = e.clientX - startX.current;
          if (dragging.current) {
            if (finalDx > 72) onYes();
            else if (finalDx < -72) onSkip();
          }
          reset();
        }}
        onPointerCancel={(e) => {
          if (!isCurrentPointer(e.pointerId)) return;
          reset();
        }}
      >
        {children}
      </div>
    </div>
  );
}
