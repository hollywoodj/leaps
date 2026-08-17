"use client";

import { BarChart } from "@/components/Charts";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { ProgressBar, StatChip } from "@/components/ProgressBar";
import { api } from "@/lib/client";
import { todayISO } from "@/lib/dates";
import type { ReportsPayload, Tag } from "@/lib/types";
import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const PERIODS = ["week", "month", "year", "all"] as const;

export function ReportsView() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("month");
  const [tagId, setTagId] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [tab, setTab] = useState<"progress" | "trends" | "calendar" | "rankings">("progress");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const query = new URLSearchParams({ period, date: todayISO() });
      if (tagId) query.set("tagId", tagId);
      const [reports, tagPayload] = await Promise.all([
        api<ReportsPayload>(`/api/reports?${query}`),
        api<{ tags: Tag[] }>("/api/tags"),
      ]);
      setData(reports);
      setTags(tagPayload.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reports");
    }
  }, [period, tagId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">All in one place</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-semibold capitalize",
              period === p ? "bg-ink text-white" : "bg-white text-muted shadow-card",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTagId("")}
            className={clsx("rounded-full px-3 py-1 text-xs font-semibold", !tagId ? "bg-teal text-white" : "bg-white shadow-card")}
          >
            All tags
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setTagId(tag.id)}
              className={clsx("rounded-full px-3 py-1 text-xs font-semibold", tagId === tag.id ? "text-white" : "bg-white shadow-card")}
              style={tagId === tag.id ? { background: tag.color } : undefined}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-bad">{error}</p>}
      {!data && !error && <p className="mt-8 text-sm text-muted">Building reports…</p>}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatChip label="Overall" value={`${Math.round(data.overallPercent)}%`} />
            <StatChip label="On pace" value={`${data.onTrackCount}/${data.trackerCount}`} />
            <StatChip label="Perfect days" value={`${data.perfectDays}`} />
            <StatChip label="Days tracked" value={`${data.dayCount}`} />
          </div>

          <div className="mt-6 flex gap-1 rounded-2xl bg-white p-1 shadow-card">
            {(["progress", "trends", "calendar", "rankings"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={clsx(
                  "flex-1 rounded-xl px-2 py-2 text-xs font-semibold capitalize",
                  tab === id ? "bg-stone-100 text-ink" : "text-muted",
                )}
              >
                {id}
              </button>
            ))}
          </div>

          {tab === "progress" && (
            <div className="mt-4 space-y-3">
              {data.trackers.length === 0 && (
                <p className="text-sm text-muted">
                  No trackers yet. <Link href="/create" className="font-semibold text-teal">Create one</Link>.
                </p>
              )}
              {data.trackers.map((row) => (
                <Link key={row.tracker.id} href={`/trackers/${row.tracker.id}`} className="card block p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <span>{row.tracker.emoji}</span>
                      {row.tracker.title}
                    </div>
                    <span className={clsx("text-xs font-semibold", row.progress.onTrack ? "text-good" : "text-bad")}>
                      {Math.round(Math.min(row.progress.percent, 999))}%
                    </span>
                  </div>
                  <ProgressBar
                    percent={row.progress.percent}
                    pacePercent={row.progress.pacePercent}
                    color={row.tracker.color}
                    onTrack={row.progress.onTrack}
                  />
                  <p className="mt-2 text-xs text-muted">{row.progress.label}</p>
                </Link>
              ))}
            </div>
          )}

          {tab === "trends" && (
            <div className="card mt-4 p-4">
              <p className="mb-3 text-sm text-muted">Completion rate across the selected period.</p>
              <BarChart bars={data.trends} />
            </div>
          )}

          {tab === "calendar" && (
            <div className="card mt-4 p-4">
              <CalendarHeatmap days={data.calendar} />
            </div>
          )}

          {tab === "rankings" && (
            <div className="mt-4 space-y-2">
              {[...data.trackers]
                .sort((a, b) => b.progress.streak - a.progress.streak || b.progress.successRate - a.progress.successRate)
                .map((row, index) => (
                  <Link key={row.tracker.id} href={`/trackers/${row.tracker.id}`} className="card flex items-center gap-3 p-3">
                    <span className="w-6 text-center text-sm font-bold text-muted">{index + 1}</span>
                    <span className="text-xl">{row.tracker.emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{row.tracker.title}</div>
                      <div className="text-xs text-muted">
                        {row.progress.streak} day streak · {Math.round(row.progress.successRate * 100)}% success
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
