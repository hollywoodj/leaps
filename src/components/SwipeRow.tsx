"use client";

import { useRef, useState } from "react";

export function SwipeRow({
  children,
  enabled,
  onYes,
  onSkip,
  onTap,
  onDelete,
  yesLabel = "Yes",
  skipLabel = "Skip",
  yesColor = "#34c759",
  skipColor = "#8e8e93",
  yesSide = "right",
}: {
  children: React.ReactNode;
  enabled: boolean;
  onYes?: () => void;
  onSkip?: () => void;
  onTap?: () => void;
  onDelete?: () => void;
  yesLabel?: string;
  skipLabel?: string;
  yesColor?: string;
  skipColor?: string;
  yesSide?: "left" | "right";
}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const pointerId = useRef<number | null>(null);
  const tracking = useRef(false);
  const [dx, setDx] = useState(0);
  const dragging = useRef(false);
  const axis = useRef<"h" | "v" | null>(null);

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

  const swipeOn = enabled || Boolean(onDelete);
  const deleteMode = Boolean(onDelete);

  const right = deleteMode
    ? { label: "Delete", color: "#ff3b30" }
    : yesSide === "right"
      ? { label: yesLabel, color: yesColor }
      : { label: skipLabel, color: skipColor };
  const left = deleteMode
    ? null
    : yesSide === "left"
      ? { label: yesLabel, color: yesColor }
      : { label: skipLabel, color: skipColor };

  function handleUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isCurrentPointer(e.pointerId)) return;
    const finalDx = e.clientX - startX.current;
    const finalDy = e.clientY - startY.current;
    if (dragging.current) {
      if (deleteMode) {
        if (finalDx < -72) onDelete?.();
      } else if (yesSide === "right") {
        if (finalDx > 72) onYes?.();
        else if (finalDx < -72) onSkip?.();
      } else {
        if (finalDx < -72) onYes?.();
        else if (finalDx > 72) onSkip?.();
      }
    } else if (Math.abs(finalDx) < 8 && Math.abs(finalDy) < 8) {
      onTap?.();
    }
    reset();
  }

  return (
    <div className="relative overflow-hidden bg-white">
      {swipeOn && left && (
        <div
          className="absolute inset-y-0 left-0 flex w-28 items-center justify-center text-[17px] font-semibold text-white"
          style={{ background: left.color }}
        >
          {left.label}
        </div>
      )}
      {swipeOn && (
        <div
          className="absolute inset-y-0 right-0 flex w-28 items-center justify-center text-[17px] font-semibold text-white"
          style={{ background: right.color }}
        >
          {right.label}
        </div>
      )}
      <div
        className="relative bg-white touch-pan-y"
        style={{ transform: `translateX(${dx}px)`, transition: dragging.current ? "none" : "transform 180ms ease" }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button, input, textarea, select")) return;
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
            if (axis.current === "h" && swipeOn) {
              dragging.current = true;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }
          }
          if (axis.current === "h" && swipeOn) setDx(Math.max(-120, Math.min(deleteMode ? 0 : 120, mx)));
        }}
        onPointerUp={handleUp}
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
