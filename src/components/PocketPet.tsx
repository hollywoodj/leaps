"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import {
  CAP_SPRITE,
  DUMB_FRAMES,
  HUNGRY_SPRITE,
  PET_SPRITES,
  PET_VISUAL_CATEGORIES,
  SAD_SPRITE,
  SICK_SPRITE,
  SMELL_FRAMES,
  spriteForPet,
  TIRED_SPRITE,
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
  const dumbMark = DUMB_FRAMES[frame % 2];
  const presentCats = useMemo(
    () => state.categories.filter((cat) => cat.present),
    [state.categories],
  );
  const cols = sprite[0]?.length ?? 10;
  const bodyW = cols * CELL;
  const originX = Math.round((154 - bodyW) / 2);
  const originY = state.graduated ? 40 : 32;
  const chipStep = presentCats.length ? Math.min(21, Math.floor(138 / presentCats.length)) : 21;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const id = window.setInterval(() => setFrame((n) => n + 1), 700);
    return () => window.clearInterval(id);
  }, []);

  const label = [
    state.status,
    state.alive ? "healthy pocket pet" : state.total ? "dead pocket pet" : "pocket pet egg",
    state.smell ? "with a smell cloud" : "",
    state.muscled ? "with muscles from fitness" : "",
    state.fat ? "looking fat from skipped workouts" : "",
    state.graduated ? "wearing a graduation cap" : "",
    state.dumb ? "looking dumb from skipped learning" : "",
    state.hungry ? "hungry" : "",
    state.tired ? "tired" : "",
    state.sad ? "sad" : "",
    state.sick ? "sick" : "",
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
            {state.graduated && (
              <g style={{ transform: `translate(${originX}px, ${originY - CAP_SPRITE.length * CELL + 4}px)` }}>
                <PixelGrid rows={CAP_SPRITE} fill="var(--pet-lcd-pixel)" />
              </g>
            )}
            <g style={{ transform: `translate(${originX}px, ${originY}px)`, transition: "transform 280ms ease" }}>
              <PixelGrid rows={sprite} fill="var(--pet-lcd-pixel)" />
            </g>
            {state.tired && (
              <g style={{ transform: `translate(${Math.max(4, originX - 16)}px, ${originY - 4}px)` }}>
                <PixelGrid rows={TIRED_SPRITE} fill="var(--pet-lcd-muted)" />
              </g>
            )}
            {state.hungry && (
              <g style={{ transform: `translate(${Math.max(4, originX - 18)}px, ${originY + 18}px)` }}>
                <PixelGrid rows={HUNGRY_SPRITE} fill="var(--pet-lcd-pixel)" />
              </g>
            )}
            {state.sad && (
              <g style={{ transform: `translate(${Math.max(4, originX - 10)}px, ${originY + 8}px)` }}>
                <PixelGrid rows={SAD_SPRITE} fill="var(--pet-lcd-muted)" />
              </g>
            )}
            {state.sick && (
              <g style={{ transform: `translate(${originX + bodyW - 2}px, ${originY + 2}px)` }}>
                <PixelGrid rows={SICK_SPRITE} fill="var(--pet-lcd-muted)" />
              </g>
            )}
            {state.dumb && (
              <g style={{ transform: `translate(${originX + bodyW - 4}px, ${originY - 2}px)` }}>
                <PixelGrid rows={dumbMark} fill="var(--pet-lcd-pixel)" cell={3} />
              </g>
            )}
            {state.smell && (
              <g style={{ transform: `translate(${originX + bodyW - 8}px, ${originY}px)` }}>
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
              const x = 8 + index * chipStep;
              return (
                <g key={cat.id}>
                  <rect
                    x={x}
                    y={101}
                    width="18"
                    height="10"
                    fill={cat.complete ? "var(--pet-lcd-pixel)" : "transparent"}
                    stroke="var(--pet-lcd-pixel)"
                    strokeWidth="1"
                    opacity={cat.complete ? 1 : 0.45}
                  />
                  <text
                    x={x + 9}
                    y={109}
                    textAnchor="middle"
                    fill={cat.complete ? "var(--pet-lcd-bg)" : "var(--pet-lcd-pixel)"}
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
                    fontSize="5.5"
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
        Tag habits Hygiene, Fitness, Learning, Food, Sleep, Mind, or Health in Leaps. Completing every due habit keeps the pet
        alive. Fitness makes muscles or fat. Learning gives a cap or a dumb look. Skipping hygiene adds a smell.
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
