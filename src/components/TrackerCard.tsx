"use client";

import { ProgressBar } from "@/components/ProgressBar";
import { SwipeRow } from "@/components/SwipeRow";
import { frequencyLabel, reportMetrics } from "@/lib/labels";
import type { TodayItem } from "@/lib/types";
import clsx from "clsx";
import { Check, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function TrackerCard({
  item,
  onYes,
  onDid,
  onSkip,
  onUndo,
  onLog,
  onToggleMilestone,
  variant = "today",
  busy = false,
}: {
  item: TodayItem;
  onYes: () => void;
  onDid?: () => void;
  onSkip: () => void;
  onUndo: () => void;
  onLog: () => void;
  onToggleMilestone: (id: string) => void;
  variant?: "today" | "reports";
  busy?: boolean;
}) {
  const router = useRouter();
  const { tracker, progress, section, tags } = item;
  const metrics = reportMetrics(tracker, progress);
  const skipped = section === "done" && item.todayLogs.some((l) => l.status === "skip");
  const swipeable =
    variant === "today" && (section === "due" || section === "missed") && tracker.type === "habit" && !busy;
  const tag = tags[0];

  function openDetail() {
    router.push(`/trackers/${tracker.id}`);
  }

  const row = (
    <article className={clsx("bg-white px-4 py-2.5", busy && "pointer-events-none opacity-60")}>
      <div className="flex items-center gap-3">
        {variant === "today" && <CheckButton item={item} onYes={onYes} onUndo={onUndo} onLog={onLog} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-[17px] font-semibold leading-5 text-navy">
              {tag && (
                <span className="mr-1.5 inline-block h-[7px] w-[7px] translate-y-[-1px] rounded-full" style={{ background: tag.color }} />
              )}
              {tracker.title} <span className="text-[15px] font-normal">{tracker.emoji}</span>
            </h3>
            <div className="shrink-0 text-right">
              <div
                className={clsx(
                  "text-[20px] font-semibold leading-none",
                  tracker.isBad && section === "missed" ? "text-bad" : "text-label",
                )}
              >
                {metrics.primary}
              </div>
              <div className="mt-0.5 text-[11px] text-muted">{metrics.secondary}</div>
            </div>
          </div>
          <div className="mt-1.5">
            <ProgressBar percent={progress.percent} pacePercent={progress.pacePercent} onTrack={progress.onTrack} />
          </div>
          <p className="mt-1 text-[12px] text-muted">{skipped ? "Skipped" : frequencyLabel(tracker)}</p>
        </div>
      </div>
      {tracker.type === "project" && item.milestones.length > 0 && variant === "today" && (
        <ul className="mt-1.5 space-y-0.5 pl-[48px]">
          {item.milestones.map((milestone) => (
            <li key={milestone.id}>
              <button
                type="button"
                onClick={() => onToggleMilestone(milestone.id)}
                className="flex w-full items-center gap-2 py-1 text-left text-[15px] press"
              >
                <span
                  className={clsx(
                    "flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px]",
                    milestone.completed ? "border-good bg-good text-white" : "border-fill",
                  )}
                >
                  {milestone.completed ? <Check size={12} strokeWidth={3} /> : null}
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
    <SwipeRow
      enabled={swipeable}
      onTap={openDetail}
      onYes={tracker.isBad ? onDid ?? onYes : onYes}
      onSkip={onSkip}
      yesLabel="Yes"
      skipLabel="Skip"
      yesColor={tracker.isBad ? "#ff3b30" : "#34c759"}
      skipColor="#8e8e93"
      yesSide={tracker.isBad ? "left" : "right"}
    >
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
  const { tracker, section, progress, todayValue } = item;
  const done = section === "done";
  const missed = section === "missed";
  const skipped = done && item.todayLogs.some((l) => l.status === "skip");
  const needed = tracker.repeatKind === "daily" ? tracker.timesPerPeriod : 1;
  const fraction = needed > 0 ? Math.min(1, todayValue / needed) : 0;

  if (tracker.type === "target" || tracker.type === "average") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLog();
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white press"
        style={{ background: tracker.color }}
        aria-label="Log value"
      >
        <Plus size={18} strokeWidth={2.6} />
      </button>
    );
  }

  if (tracker.type === "project") {
    return (
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e5ea" strokeWidth="2.4" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={tracker.color}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray={`${(Math.min(100, progress.percent) / 100) * 94.2} 94.2`}
            transform="rotate(-90 18 18)"
          />
        </svg>
        <span className="text-[11px] font-bold text-muted">{Math.round(progress.percent)}</span>
      </span>
    );
  }

  if (skipped) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUndo();
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c7c7cc] text-white press"
        aria-label="Undo skip"
      >
        <Minus size={16} strokeWidth={3} />
      </button>
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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-good text-white press"
        aria-label="Undo"
      >
        <Check size={18} strokeWidth={3} />
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
      className="relative flex h-9 w-9 shrink-0 items-center justify-center press"
      aria-label={tracker.isBad ? "Resisted" : "Yes"}
    >
      <svg viewBox="0 0 36 36" className="absolute inset-0">
        <circle cx="18" cy="18" r="15" fill="none" stroke={missed ? "#ff3b30" : "#c7c7cc"} strokeWidth="2.4" />
        {fraction > 0 && (
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={tracker.isBad ? "#ff3b30" : tracker.color || "#34c759"}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray={`${fraction * 94.2} 94.2`}
            transform="rotate(-90 18 18)"
          />
        )}
      </svg>
    </button>
  );
}
