"use client";

import { ProgressBar } from "@/components/ProgressBar";
import type { TodayItem } from "@/lib/types";
import clsx from "clsx";
import { Check, Plus, Undo2 } from "lucide-react";
import Link from "next/link";

const TYPE_LABEL: Record<string, string> = {
  habit: "Habit",
  target: "Target",
  average: "Average",
  project: "Project",
};

export function TrackerCard({
  item,
  onYes,
  onNo,
  onSkip,
  onUndo,
  onLog,
  onToggleMilestone,
}: {
  item: TodayItem;
  onYes: () => void;
  onNo: () => void;
  onSkip: () => void;
  onUndo: () => void;
  onLog: () => void;
  onToggleMilestone: (id: string) => void;
}) {
  const { tracker, progress, section } = item;
  const done = section === "done";
  const missed = section === "missed";

  return (
    <article className="card p-4">
      <div className="flex items-start gap-3">
        <Link href={`/trackers/${tracker.id}`} className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl">
            {tracker.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{tracker.title}</h3>
              {tracker.isBad && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bad">
                  Limit
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {TYPE_LABEL[tracker.type]}
              {progress.streak ? ` · ${progress.streak} day streak` : ""}
              {done && item.todayLogs.some((l) => l.status === "skip") ? " · Skipped" : ""}
            </p>
          </div>
        </Link>
        <CardActions item={item} onYes={onYes} onNo={onNo} onSkip={onSkip} onUndo={onUndo} onLog={onLog} />
      </div>

      <div className="mt-3">
        <ProgressBar percent={progress.percent} pacePercent={progress.pacePercent} color={tracker.color} onTrack={progress.onTrack} />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted">{progress.label}</span>
          <span className={clsx("font-semibold", progress.onTrack ? "text-good" : "text-bad")}>
            {missed ? "Behind" : progress.onTrack ? "On pace" : "Behind pace"}
          </span>
        </div>
      </div>

      {tracker.type === "project" && item.milestones.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {item.milestones.map((milestone) => (
            <li key={milestone.id}>
              <button
                type="button"
                onClick={() => onToggleMilestone(milestone.id)}
                className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left text-sm hover:bg-stone-50"
              >
                <span
                  className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded-md border",
                    milestone.completed ? "border-transparent text-white" : "border-stone-300",
                  )}
                  style={milestone.completed ? { background: tracker.color } : undefined}
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
}

function CardActions({
  item,
  onYes,
  onNo,
  onSkip,
  onUndo,
  onLog,
}: {
  item: TodayItem;
  onYes: () => void;
  onNo: () => void;
  onSkip: () => void;
  onUndo: () => void;
  onLog: () => void;
}) {
  const { tracker, section } = item;
  if (section !== "due") {
    return (
      <button
        type="button"
        onClick={onUndo}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-muted"
        title="Undo"
      >
        <Undo2 size={18} />
      </button>
    );
  }

  if (tracker.type === "habit") {
    return (
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onSkip} className="rounded-full px-2 py-1 text-[11px] font-semibold text-muted hover:bg-stone-100">
          Skip
        </button>
        <button
          type="button"
          onClick={onNo}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-muted"
          title={tracker.isBad ? "I did it" : "No"}
        >
          {tracker.isBad ? "Yes" : "No"}
        </button>
        <button
          type="button"
          onClick={onYes}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm"
          style={{ background: tracker.isBad ? "#15803d" : tracker.color }}
          title={tracker.isBad ? "Resisted" : "Yes"}
        >
          {tracker.isBad ? <Check size={18} /> : tracker.timesPerPeriod > 1 ? <Plus size={18} /> : <Check size={18} />}
        </button>
      </div>
    );
  }

  if (tracker.type === "project") return null;

  return (
    <button
      type="button"
      onClick={onLog}
      className="flex h-11 w-11 items-center justify-center rounded-full text-white"
      style={{ background: tracker.color }}
    >
      <Plus size={18} />
    </button>
  );
}
