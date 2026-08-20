"use client";

import { BarChart } from "@/components/Charts";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { HeaderButton, NavHeader } from "@/components/NavHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { api } from "@/lib/client";
import { formatPretty, formatShort, todayISO } from "@/lib/dates";
import { frequencyLabel, reportMetrics } from "@/lib/labels";
import { formatNumber } from "@/lib/stats";
import type { ReportsPayload, Tag } from "@/lib/types";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Settings, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const TABS = ["Progress", "Trends", "Calendar", "Rankings"] as const;
const PERIODS = ["week", "month", "year", "all"] as const;

export function ReportsView() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("month");
  const [tagId, setTagId] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Progress");
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

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

  const totals = useMemo(() => {
    if (!data) return { done: 0, due: 0, avg: 0 };
    const done = data.trackers.reduce((s, t) => s + t.completed, 0);
    const due = data.trackers.reduce((s, t) => s + t.dueCount, 0);
    return { done, due, avg: data.dayCount ? done / data.dayCount : 0 };
  }, [data]);

  return (
    <div>
      <NavHeader
        title="Reports"
        menu={[
          { href: "/", label: "Today" },
          { href: "/reports", label: "Reports" },
        ]}
        left={
          <HeaderButton href="/settings" label="Settings">
            <Settings size={22} />
          </HeaderButton>
        }
        right={
          <HeaderButton onClick={() => setFilterOpen((v) => !v)} label="Filter">
            <SlidersHorizontal size={20} />
          </HeaderButton>
        }
        tabs={[...TABS]}
        activeTab={tab}
        onTab={(next) => setTab(next as (typeof TABS)[number])}
      >
        {tab === "Trends" && data && (
          <div className="px-4 pb-3">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-[17px] font-semibold">Total Done</div>
                <div className="text-[12px] text-white/75">Average: {formatNumber(Number(totals.avg.toFixed(1)))} per day</div>
              </div>
              <div className="text-right">
                <div className="text-[28px] font-bold leading-none">{Math.round(data.overallPercent)}%</div>
                <div className="text-[12px] text-white/75">
                  {totals.done}/{totals.due}
                </div>
              </div>
            </div>
            <BarChart bars={data.trends} onNavy />
            {data.trends.length > 1 && (
              <div className="mt-1 flex justify-between text-[10px] text-white/70">
                <span>{formatShort(data.trends[0].date)}</span>
                <span>{formatShort(data.trends[data.trends.length - 1].date)}</span>
              </div>
            )}
          </div>
        )}
      </NavHeader>

      {filterOpen && (
        <div className="flex flex-wrap gap-2 bg-white px-4 py-3">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={clsx(
                "rounded-full px-3 py-1 text-[12px] font-semibold capitalize",
                period === p ? "bg-ios text-white" : "bg-grouped text-label",
              )}
            >
              {p}
            </button>
          ))}
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setTagId(tagId === tag.id ? "" : tag.id)}
              className="rounded-full px-3 py-1 text-[12px] font-semibold"
              style={tagId === tag.id ? { background: tag.color, color: "white" } : { background: "#f2f2f7" }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between bg-[#ececf1] px-4 py-2 text-[13px] font-medium text-label">
        <ChevronLeft size={16} className="text-muted" />
        <span>
          {period === "month" ? "Month" : period === "week" ? "Week" : period === "year" ? "Year" : "All"}:{" "}
          {period === "month" || period === "week" || period === "year"
            ? formatPretty(data?.to ?? todayISO(), { month: "long", year: "numeric" })
            : "All time"}
        </span>
        <ChevronRight size={16} className="text-muted" />
      </div>

      {error && <p className="px-4 py-3 text-sm text-bad">{error}</p>}
      {!data && !error && <p className="px-4 py-8 text-center text-sm text-muted">Building reports…</p>}

      {data && tab === "Progress" && (
        <div className="divide-y divide-black/[0.06] bg-white">
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[16px] font-semibold text-navy">Average Progress: {Math.round(data.overallPercent)}%</div>
              <div className="text-right">
                <div className="text-[17px] font-semibold">{data.onTrackCount}/{data.trackerCount}</div>
                <div className="text-[11px] text-good">on track</div>
              </div>
            </div>
            <ProgressBar percent={data.overallPercent} onTrack />
          </div>
          {data.trackers.map((row) => {
            const metrics = reportMetrics(row.tracker, row.progress);
            return (
              <Link key={row.tracker.id} href={`/trackers/${row.tracker.id}`} className="block px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="truncate text-[16px] font-semibold text-navy">
                    {row.tracker.title} {row.tracker.emoji}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[17px] font-semibold leading-none">{metrics.primary}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{metrics.secondary}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <ProgressBar percent={row.progress.percent} pacePercent={row.progress.pacePercent} onTrack={row.progress.onTrack} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {data && tab === "Trends" && (
        <div className="divide-y divide-black/[0.06] bg-white">
          {data.trackers.map((row) => (
            <Link key={row.tracker.id} href={`/trackers/${row.tracker.id}`} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-[16px] font-semibold text-navy">
                  {row.tracker.title} {row.tracker.emoji}
                </div>
                <div className="text-[12px] text-muted">{frequencyLabel(row.tracker)}</div>
              </div>
              <div className="text-right">
                <div className="text-[17px] font-semibold">{Math.round(row.progress.successRate * 100)}%</div>
                <div className="text-[12px] text-muted">
                  {row.completed}/{row.dueCount}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && tab === "Calendar" && (
        <div className="bg-white px-4 py-4">
          <CalendarHeatmap days={data.calendar} />
        </div>
      )}

      {data && tab === "Rankings" && (
        <div className="divide-y divide-black/[0.06] bg-white">
          {[...data.trackers]
            .sort((a, b) => b.progress.streak - a.progress.streak || b.progress.successRate - a.progress.successRate)
            .map((row, index) => (
              <Link key={row.tracker.id} href={`/trackers/${row.tracker.id}`} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-center text-[15px] font-bold text-muted">{index + 1}</span>
                <div className="flex-1">
                  <div className="text-[16px] font-semibold text-navy">
                    {row.tracker.title} {row.tracker.emoji}
                  </div>
                  <div className="text-[12px] text-muted">
                    {row.progress.streak} day streak · {Math.round(row.progress.successRate * 100)}% success
                  </div>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
