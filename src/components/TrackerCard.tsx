"use client";

import { ProgressBar } from "@/components/ProgressBar";
import { SwipeRow } from "@/components/SwipeRow";
import { frequencyLabel, reportMetrics } from "@/lib/labels";
import type { TodayItem } from "@/lib/types";
import clsx from "clsx";
import { Check, Plus } from "lucide-react";
import Link from "next/link";

export function TrackerCard({
  item,
  onYes,
  onSkip,
  onUndo,
  onLog,
  onToggleMilestone,
  variant = "today",
}: {
  item: TodayItem;
  onYes: () => void;
  onSkip: () => void;
  onUndo: () => void;
  onLog: () => void;
  onToggleMilestone: (id: string) => void;
  variant?: "today" | "reports";
}) {
  const { tracker, progress, section } = item;
  const done = section === "done";
  const metrics = reportMetrics(tracker, progress);
  const skipped = done && item.todayLogs.some((l) => l.status === "skip");

  const row = (
    <article className="bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        {variant === "today" && (
          <CheckButton
            item={item}
            onYes={onYes}
            onUndo={onUndo}
            onLog={onLog}
          />
        )}
        <Link href={`/trackers/${tracker.id}`} className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-[16px] font-semibold text-navy">
              {tracker.title} <span className="font-normal">{tracker.emoji}</span>
            </h3>
            <div className="shrink-0 text-right">
              <div className="text-[17px] font-semibold leading-none text-label">{metrics.primary}</div>
              <div className="mt-0.5 text-[11px] text-muted">{metrics.secondary}</div>
            </div>
          </div>
          <div className="mt-2">
            <ProgressBar percent={progress.percent} pacePercent={progress.pacePercent} onTrack={progress.onTrack} />
          </div>
          <p className="mt-1.5 text-[12px] text-muted">
            {skipped ? "Skipped" : frequencyLabel(tracker)}
            {progress.streak > 0 ? ` · ${progress.streak} day streak` : ""}
          </p>
        </Link>
      </div>
      {tracker.type === "project" && item.milestones.length > 0 && variant === "today" && (
        <ul className="mt-2 space-y-1 pl-12">
          {item.milestones.map((milestone) => (
            <li key={milestone.id}>
              <button
                type="button"
                onClick={() => onToggleMilestone(milestone.id)}
                className="flex w-full items-center gap-2 py-1 text-left text-[14px]"
              >
                <span
                  className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded-full border",
                    milestone.completed ? "border-good bg-good text-white" : "border-fill",
                  )}
                >
                  {milestone.completed ? <Check size={12} /> : null}
                </span>
                <span className={clsx(milestone.completed && "text-muted line-through")}>{milestone.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );

  return (
    <SwipeRow enabled={variant === "today" && section === "due" && tracker.type === "habit"} onYes={onYes} onSkip={onSkip}>
      {row}
    </SwipeRow>
  );
}

function CheckButton({
  item,
  onYes,
  onUndo,
  onLog,
}: {
  item: TodayItem;
  onYes: () => void;
  onUndo: () => void;
  onLog: () => void;
}) {
  const { tracker, section, progress } = item;
  const done = section === "done";
  const missed = section === "missed";

  if (tracker.type === "target" || tracker.type === "average") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLog();
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: tracker.color }}
        aria-label="Log value"
      >
        <Plus size={16} strokeWidth={2.6} />
      </button>
    );
  }

  if (tracker.type === "project") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2.5px] border-fill text-[11px] font-bold text-muted">
        {Math.round(progress.percent)}
      </span>
    );
  }

  if (done) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUndo();
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-good text-white"
        aria-label="Undo"
      >
        <Check size={16} strokeWidth={3} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onYes();
      }}
      className={clsx(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2.5px]",
        missed ? "border-bad" : "border-fill",
      )}
      aria-label={tracker.isBad ? "Resisted" : "Yes"}
    />
  );
}
