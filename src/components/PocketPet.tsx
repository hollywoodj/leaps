"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import {
  PET_SPRITES,
  PET_VISUAL_CATEGORIES,
  SMELL_FRAMES,
  spriteForPet,
  type PetState,
} from "@/lib/pet";

const CELL = 4;

function PixelGrid({
  rows,
  fill,
  x = 0,
  y = 0,
  cell = CELL,
}: {
  rows: string[];
  fill: string;
  x?: number;
  y?: number;
  cell?: number;
}) {
  const rects: { key: string; x: number; y: number; w: number; h: number }[] = [];
  rows.forEach((row, rowIndex) => {
    let col = 0;
    while (col < row.length) {
      if (row[col] !== "#") {
        col += 1;
        continue;
      }
      const start = col;
      while (col < row.length && row[col] === "#") col += 1;
      rects.push({
        key: `${rowIndex}-${start}`,
        x: x + start * cell,
        y: y + rowIndex * cell,
        w: (col - start) * cell,
        h: cell,
      });
    }
  });
  return (
    <g>
      {rects.map((rect) => (
        <rect key={rect.key} x={rect.x} y={rect.y} width={rect.w} height={rect.h} fill={fill} />
      ))}
    </g>
  );
}

export function PocketPet({
  state,
  compact = false,
}: {
  state: PetState;
  compact?: boolean;
}) {
  const [frame, setFrame] = useState(0);
  const spriteName = spriteForPet(state);
  const sprite = PET_SPRITES[spriteName][frame % 2];
  const smell = SMELL_FRAMES[frame % 2];
  const presentCats = useMemo(
    () => state.categories.filter((cat) => cat.present),
    [state.categories],
  );

  useEffect(() => {
    const id = window.setInterval(() => setFrame((n) => n + 1), 700);
    return () => window.clearInterval(id);
  }, []);

  const label = [
    state.status,
    state.alive ? "healthy pocket pet" : state.total ? "dead pocket pet" : "pocket pet egg",
    state.smell ? "with a smell cloud" : "",
    state.bigger ? "visually bigger from workouts" : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={clsx("pocket-pet", compact && "is-compact")}
      role="img"
      aria-label={label}
    >
      <div className="pocket-pet-chain" aria-hidden>
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="pocket-pet-eyelet" aria-hidden />
      <div className="pocket-pet-shell">
        <div className="pocket-pet-bezel">
          <svg className="pocket-pet-lcd" viewBox="0 0 154 118" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
            <rect width="154" height="118" fill="var(--pet-lcd-bg)" />
            <text
              x="77"
              y="16"
              textAnchor="middle"
              fill="var(--pet-lcd-pixel)"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
              fontSize="8"
              fontWeight="700"
            >
              {state.status}
            </text>
            <g
              style={{
                transform: `translate(57px, 34px) scale(${state.sizeScale})`,
                transformOrigin: "20px 14px",
                transition: "transform 280ms ease",
              }}
            >
              <PixelGrid rows={sprite} fill="var(--pet-lcd-pixel)" />
            </g>
            {state.smell && (
              <g style={{ transform: `translate(${72 + state.sizeScale * 18}px, 28px)` }}>
                <g className="pocket-pet-smell">
                  <PixelGrid rows={smell} fill="var(--pet-lcd-muted)" cell={3} />
                  <text
                    x="18"
                    y="8"
                    fill="var(--pet-lcd-pixel)"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
                    fontSize="9"
                    fontWeight="700"
                  >
                    ~
                  </text>
                  <text
                    x="8"
                    y="22"
                    fill="var(--pet-lcd-muted)"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
                    fontSize="10"
                    fontWeight="700"
                  >
                    ~
                  </text>
                  <text
                    x="22"
                    y="30"
                    fill="var(--pet-lcd-pixel)"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
                    fontSize="8"
                    fontWeight="700"
                  >
                    stink
                  </text>
                </g>
              </g>
            )}
            <rect x="8" y="96" width="138" height="1" fill="var(--pet-lcd-muted)" />
            {presentCats.map((cat, index) => {
              const meta = PET_VISUAL_CATEGORIES.find((row) => row.id === cat.id)!;
              const x = 12 + index * 23;
              return (
                <g key={cat.id}>
                  <rect
                    x={x}
                    y={101}
                    width="16"
                    height="10"
                    fill={cat.complete ? "var(--pet-lcd-pixel)" : "transparent"}
                    stroke="var(--pet-lcd-pixel)"
                    strokeWidth="1"
                    opacity={cat.complete ? 1 : 0.45}
                  />
                  <text
                    x={x + 8}
                    y={109}
                    textAnchor="middle"
                    fill={cat.complete ? "var(--pet-lcd-bg)" : "var(--pet-lcd-pixel)"}
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
                    fontSize="6"
                    fontWeight="700"
                  >
                    {meta.label.slice(0, 3).toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

export function PetCategoryLegend({ state }: { state: PetState }) {
  const rows = state.categories.filter((cat) => cat.present);
  if (!rows.length) {
    return (
      <p className="px-6 text-center text-[13px] leading-5 text-muted">
        Tag habits Hygiene, Fitness, Food, Sleep, Mind, or Health. Completing every due habit keeps the pet alive.
        Workouts make it bigger. Skipping hygiene adds a smell.
      </p>
    );
  }
  return (
    <ul className="ios-inset divide-y divide-[rgba(60,60,67,0.12)]">
      {rows.map((cat) => {
        const meta = PET_VISUAL_CATEGORIES.find((row) => row.id === cat.id)!;
        return (
          <li key={cat.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                <span className="text-[15px] font-semibold text-label">{meta.label}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-muted">{meta.effect}</p>
            </div>
            <span className={clsx("text-[13px] font-semibold", cat.complete ? "text-good" : "text-bad")}>
              {cat.done}/{cat.total}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
