"use client";

import { BarChart } from "@/components/Charts";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { FilterItem, FilterPopover, IosSpinner } from "@/components/ios";
import { HeaderButton, NavHeader } from "@/components/NavHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { api } from "@/lib/client";
import { addDays, addMonths, formatPretty, formatShort, todayISO } from "@/lib/dates";
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
  const [asOf, setAsOf] = useState(() => todayISO());
  const [tagId, setTagId] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Progress");
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const today = todayISO();

  const load = useCallback(async () => {
    setError(null);
    try {
      const query = new URLSearchParams({ period, date: asOf });
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
  }, [period, tagId, asOf]);

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
          { href: "/", label: "Daily Goals" },
          { href: "/pet", label: "Pocket Pet" },
          { href: "/reports", label: "Reports" },
        ]}
        left={
          <HeaderButton href="/settings" label="Settings">
            <Settings size={22} />
          </HeaderButton>
        }
        right={
          <div className="relative">
            <HeaderButton onClick={() => setFilterOpen((v) => !v)} label="Filter" active={Boolean(tagId) || period !== "month" || filterOpen}>
              <SlidersHorizontal size={20} />
            </HeaderButton>
            <FilterPopover open={filterOpen} onClose={() => setFilterOpen(false)}>
              <div className="px-3.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Period</div>
              {PERIODS.map((p) => (
                <FilterItem
                  key={p}
                  active={period === p}
                  onClick={() => {
                    setPeriod(p);
                    setAsOf(todayISO());
                  }}
                >
                  {p === "all" ? "All time" : p[0].toUpperCase() + p.slice(1)}
                </FilterItem>
              ))}
              <div className="my-1 h-px bg-[rgba(60,60,67,0.12)]" />
              <div className="px-3.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Tags</div>
              <FilterItem active={!tagId} onClick={() => setTagId("")}>
                All
              </FilterItem>
              {tags.map((tag) => (
                <FilterItem
                  key={tag.id}
                  active={tagId === tag.id}
                  color={tag.color}
                  onClick={() => setTagId(tagId === tag.id ? "" : tag.id)}
                >
                  {tag.name}
                </FilterItem>
              ))}
            </FilterPopover>
          </div>
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

      <div className="hairline flex h-11 items-center justify-between bg-[#f7f7f7] px-3 text-[15px] font-semibold text-label">
        <button
          type="button"
          className="rounded-full p-1 text-ios disabled:text-muted disabled:opacity-40 press"
          aria-label="Previous period"
          disabled={period === "all"}
          onClick={() => {
            if (period === "week") setAsOf((d) => addDays(d, -7));
            else if (period === "month") setAsOf((d) => addMonths(d, -1));
            else if (period === "year") setAsOf((d) => addMonths(d, -12));
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          {period === "all"
            ? "All time"
            : period === "week"
              ? `${formatShort(data?.from ?? addDays(asOf, -6))} – ${formatShort(data?.to ?? asOf)}`
              : period === "year"
                ? formatPretty(data?.to ?? asOf, { year: "numeric" })
                : formatPretty(data?.to ?? asOf, { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          className="rounded-full p-1 text-ios disabled:text-muted disabled:opacity-40 press"
          aria-label="Next period"
          disabled={period === "all" || asOf >= today}
          onClick={() => {
            const next =
              period === "week" ? addDays(asOf, 7)
                : period === "month" ? addMonths(asOf, 1)
                  : addMonths(asOf, 12);
            setAsOf(next > today ? today : next);
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {error && <p className="px-4 py-3 text-sm text-bad">{error}</p>}
      {!data && !error && <IosSpinner label="Building reports" />}

      {data && tab === "Progress" && (
        <div className="ios-group divide-y divide-[rgba(60,60,67,0.12)]">
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[16px] font-semibold text-navy">Average Progress: {Math.round(data.overallPercent)}%</div>
              <div className="text-right">
                <div className="text-[20px] font-semibold leading-none">{data.onTrackCount}/{data.trackerCount}</div>
                <div className="text-[11px] text-good">on track</div>
              </div>
            </div>
            <ProgressBar percent={data.overallPercent} onTrack />
          </div>
          {data.trackers.map((row) => {
            const metrics = reportMetrics(row.tracker, row.progress);
            return (
              <Link key={row.tracker.id} href={`/trackers/${row.tracker.id}`} className="block px-4 py-3 press">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-[17px] font-semibold leading-5 text-navy">
                      {row.tags[0] && (
                        <span className="mr-1.5 inline-block h-[7px] w-[7px] translate-y-[-1px] rounded-full" style={{ background: row.tags[0].color }} />
                      )}
                      {row.tracker.title} <span className="text-[15px] font-normal">{row.tracker.emoji}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">{frequencyLabel(row.tracker)}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[20px] font-semibold leading-none">{metrics.primary}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{metrics.secondary}</div>
                  </div>
                </div>
                <div className="mt-1.5">
                  <ProgressBar percent={row.progress.percent} pacePercent={row.progress.pacePercent} onTrack={row.progress.onTrack} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {data && tab === "Trends" && (
        <div className="ios-group divide-y divide-[rgba(60,60,67,0.12)]">
          {data.trackers.map((row) => (
            <Link key={row.tracker.id} href={`/trackers/${row.tracker.id}`} className="flex items-center justify-between px-4 py-3 press">
              <div>
                <div className="text-[17px] font-semibold text-navy">
                  {row.tags[0] && (
                    <span className="mr-1.5 inline-block h-[7px] w-[7px] translate-y-[-1px] rounded-full" style={{ background: row.tags[0].color }} />
                  )}
                  {row.tracker.title} <span className="text-[15px] font-normal">{row.tracker.emoji}</span>
                </div>
                <div className="text-[12px] text-muted">{frequencyLabel(row.tracker)}</div>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-semibold">{Math.round(row.progress.successRate * 100)}%</div>
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
        <div className="ios-group divide-y divide-[rgba(60,60,67,0.12)]">
          {[...data.trackers]
            .sort((a, b) => b.progress.streak - a.progress.streak || b.progress.successRate - a.progress.successRate)
            .map((row, index) => (
              <Link key={row.tracker.id} href={`/trackers/${row.tracker.id}`} className="flex items-center gap-3 px-4 py-3 press">
                <span
                  className={clsx(
                    "w-7 text-center text-[17px] font-bold",
                    index === 0 ? "text-[#f5c518]" : index === 1 ? "text-[#a8b0bd]" : index === 2 ? "text-[#d4a574]" : "text-muted",
                  )}
                >
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="text-[17px] font-semibold text-navy">
                    {row.tags[0] && (
                      <span className="mr-1.5 inline-block h-[7px] w-[7px] translate-y-[-1px] rounded-full" style={{ background: row.tags[0].color }} />
                    )}
                    {row.tracker.title} <span className="text-[15px] font-normal">{row.tracker.emoji}</span>
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
