"use client";

import { DateStrip } from "@/components/DateStrip";
import { FilterItem, FilterPopover, IosSpinner } from "@/components/ios";
import { HeaderButton, NavHeader } from "@/components/NavHeader";
import { LogValueModal } from "@/components/LogValueModal";
import { PerfectDay } from "@/components/PerfectDay";
import { PocketPet } from "@/components/PocketPet";
import { TrackerCard } from "@/components/TrackerCard";
import { api } from "@/lib/client";
import { todayISO } from "@/lib/dates";
import { collectTodayItems, derivePetState } from "@/lib/pet";
import { classifyToday, sumValues } from "@/lib/stats";
import type { LogEntry, LogStatus, Tag, TodayItem } from "@/lib/types";
import { Settings, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TodayResponse = {
  date: string;
  due: TodayItem[];
  done: TodayItem[];
  missed: TodayItem[];
  perfect: boolean;
};

function allItems(data: TodayResponse): TodayItem[] {
  return [...data.due, ...data.missed, ...data.done];
}

function bucket(date: string, items: TodayItem[]): TodayResponse {
  const due: TodayItem[] = [];
  const missed: TodayItem[] = [];
  const done: TodayItem[] = [];
  for (const item of items) {
    if (item.section === "due") due.push(item);
    else if (item.section === "missed") missed.push(item);
    else done.push(item);
  }
  return { date, due, done, missed, perfect: due.length === 0 && missed.length === 0 && done.length > 0 };
}

function recategorize(item: TodayItem, date: string, todayLogs: LogEntry[], milestones = item.milestones): TodayItem {
  const section = classifyToday(item.tracker, todayLogs, date, milestones);
  return {
    ...item,
    todayLogs,
    milestones,
    todayValue: sumValues(todayLogs),
    section: section === "hidden" ? item.section : section,
  };
}

function optimisticLog(
  data: TodayResponse,
  item: TodayItem,
  date: string,
  status: LogStatus,
  value?: number,
  note?: string,
): TodayResponse {
  const log: LogEntry = {
    id: `pending:${item.tracker.id}`,
    trackerId: item.tracker.id,
    date,
    value: value ?? (status === "skip" || status === "no" ? 0 : 1),
    status,
    note: note ?? null,
    createdAt: new Date().toISOString(),
  };
  let todayLogs = item.todayLogs;
  if (status === "skip") {
    todayLogs = [log];
  } else if (
    item.tracker.type === "habit" &&
    status === "yes" &&
    item.tracker.timesPerPeriod <= 1 &&
    !item.tracker.isBad &&
    item.todayLogs.some((entry) => entry.status !== "skip")
  ) {
    todayLogs = [];
  } else {
    todayLogs = [...item.todayLogs.filter((entry) => entry.status !== "skip"), log];
  }
  const next = recategorize(item, date, todayLogs);
  return bucket(
    date,
    allItems(data).map((row) => (row.tracker.id === item.tracker.id ? next : row)),
  );
}

function optimisticUndo(data: TodayResponse, item: TodayItem, date: string): TodayResponse {
  const next = recategorize(item, date, []);
  return bucket(
    date,
    allItems(data).map((row) => (row.tracker.id === item.tracker.id ? next : row)),
  );
}

function optimisticMilestone(data: TodayResponse, item: TodayItem, date: string, milestoneId: string): TodayResponse {
  const milestones = item.milestones.map((milestone) =>
    milestone.id === milestoneId
      ? { ...milestone, completed: !milestone.completed, completedAt: milestone.completed ? null : date }
      : milestone,
  );
  const next = recategorize(item, date, item.todayLogs, milestones);
  return bucket(
    date,
    allItems(data).map((row) => (row.tracker.id === item.tracker.id ? next : row)),
  );
}

export function TodayView() {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<TodayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState<TodayItem | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagId, setTagId] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const wasPerfect = useRef<boolean | null>(null);
  const pending = useRef(new Set<string>());
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const dataRef = useRef<TodayResponse | null>(null);
  dataRef.current = data;

  function setBusy(id: string, value: boolean) {
    if (value) pending.current.add(id);
    else pending.current.delete(id);
    setBusyIds([...pending.current]);
  }

  const load = useCallback(async () => {
    setError(null);
    try {
      const [next, tagPayload] = await Promise.all([
        api<TodayResponse>(`/api/today?date=${date}`),
        api<{ tags: Tag[] }>("/api/tags"),
      ]);
      setData(next);
      setTags(tagPayload.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load today");
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    wasPerfect.current = null;
  }, [date]);

  useEffect(() => {
    if (!data) return;
    if (wasPerfect.current === false && data.perfect) setCelebrate(true);
    wasPerfect.current = data.perfect;
  }, [data]);

  async function log(item: TodayItem, status: "yes" | "no" | "skip" | "value", value?: number, note?: string) {
    if (pending.current.has(item.tracker.id) || !dataRef.current) return;
    const snapshot = dataRef.current;
    const current = allItems(snapshot).find((row) => row.tracker.id === item.tracker.id) ?? item;
    const next = optimisticLog(snapshot, current, date, status, value, note);
    dataRef.current = next;
    setBusy(item.tracker.id, true);
    setData(next);
    try {
      await api(`/api/trackers/${item.tracker.id}/logs`, {
        method: "POST",
        body: JSON.stringify({ date, status, value, note }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save log");
    } finally {
      setBusy(item.tracker.id, false);
      if (pending.current.size === 0) await load();
    }
  }

  async function undo(item: TodayItem) {
    if (pending.current.has(item.tracker.id) || !dataRef.current) return;
    const snapshot = dataRef.current;
    const current = allItems(snapshot).find((row) => row.tracker.id === item.tracker.id) ?? item;
    const next = optimisticUndo(snapshot, current, date);
    dataRef.current = next;
    setBusy(item.tracker.id, true);
    setData(next);
    try {
      await api(`/api/trackers/${item.tracker.id}/undo`, {
        method: "POST",
        body: JSON.stringify({ date }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not undo");
    } finally {
      setBusy(item.tracker.id, false);
      if (pending.current.size === 0) await load();
    }
  }

  async function toggleMilestone(item: TodayItem, id: string) {
    if (pending.current.has(item.tracker.id) || !dataRef.current) return;
    const snapshot = dataRef.current;
    const current = allItems(snapshot).find((row) => row.tracker.id === item.tracker.id) ?? item;
    const next = optimisticMilestone(snapshot, current, date, id);
    dataRef.current = next;
    setBusy(item.tracker.id, true);
    setData(next);
    try {
      await api(`/api/milestones/${id}/toggle`, { method: "POST", body: JSON.stringify({ date }) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update milestone");
    } finally {
      setBusy(item.tracker.id, false);
      if (pending.current.size === 0) await load();
    }
  }

  const filtered = (items: TodayItem[]) =>
    tagId ? items.filter((item) => item.tags.some((tag) => tag.id === tagId)) : items;

  const due = filtered(data?.due ?? []);
  const missed = filtered(data?.missed ?? []);
  const done = filtered(data?.done ?? []);
  const empty = data && due.length + done.length + missed.length === 0;
  const pet = useMemo(() => derivePetState(data ? collectTodayItems(data) : []), [data]);

  function cardHandlers(item: TodayItem) {
    return {
      onYes: () => {
        if (item.section === "missed" && item.tracker.isBad) void undo(item);
        else void log(item, item.tracker.isBad ? "no" : "yes");
      },
      onDid: () => void log(item, "yes"),
      onSkip: () => void log(item, "skip"),
      onUndo: () => void undo(item),
      onLog: () => setLogging(item),
      onToggleMilestone: (id: string) => void toggleMilestone(item, id),
    };
  }

  return (
    <div>
      <NavHeader
        title="Daily Goals"
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
            <HeaderButton onClick={() => setFilterOpen((v) => !v)} label="Filter" active={Boolean(tagId) || filterOpen}>
              <span className="relative">
                <SlidersHorizontal size={20} />
                {tagId ? <span className="filter-dot" /> : null}
              </span>
            </HeaderButton>
            <FilterPopover open={filterOpen} onClose={() => setFilterOpen(false)}>
              <FilterItem
                active={!tagId}
                onClick={() => {
                  setTagId("");
                  setFilterOpen(false);
                }}
              >
                All
              </FilterItem>
              {tags.map((tag) => (
                <FilterItem
                  key={tag.id}
                  active={tagId === tag.id}
                  color={tag.color}
                  onClick={() => {
                    setTagId(tag.id);
                    setFilterOpen(false);
                  }}
                >
                  {tag.name}
                </FilterItem>
              ))}
            </FilterPopover>
          </div>
        }
      />

      <DateStrip date={date} onChange={setDate} />

      {error && <p className="px-4 py-3 text-sm text-bad">{error}</p>}
      {!data && !error && <IosSpinner label="Loading" />}

      {data && (
        <Link href="/pet" className="block px-4 pb-1 pt-3" aria-label="Open Pocket Pet">
          <PocketPet state={pet} compact />
          <p className="mt-1 text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
            {pet.status}
          </p>
        </Link>
      )}

      {empty && (
        <div className="px-8 pb-16 pt-4 text-center">
          <h2 className="text-[20px] font-semibold text-navy">Nothing due</h2>
          <p className="mt-1 text-[15px] leading-5 text-muted">
            Add a habit, target, average, or project — or start from a template. Checking them off is the only way to care for Pocket Pet.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href="/create" className="rounded-full bg-ios px-4 py-2 text-[15px] font-semibold text-white press">
              Create Tracker
            </Link>
            <button
              type="button"
              className="rounded-full bg-white px-4 py-2 text-[15px] font-semibold text-ios shadow-card press"
              onClick={async () => {
                await api("/api/data", { method: "POST" });
                await load();
              }}
            >
              Load sample data
            </button>
          </div>
        </div>
      )}

      {data && !empty && (
        <div className="pb-5">
          <Section title="Due" count={due.length}>
            {due.map((item) => (
              <TrackerCard key={item.tracker.id} item={item} busy={busyIds.includes(item.tracker.id)} {...cardHandlers(item)} />
            ))}
          </Section>
          <Section title="Missed" count={missed.length}>
            {missed.map((item) => (
              <TrackerCard key={item.tracker.id} item={item} busy={busyIds.includes(item.tracker.id)} {...cardHandlers(item)} />
            ))}
          </Section>
          <Section title="Done" count={done.length}>
            {done.map((item) => (
              <TrackerCard key={item.tracker.id} item={item} busy={busyIds.includes(item.tracker.id)} {...cardHandlers(item)} />
            ))}
          </Section>
        </div>
      )}

      <LogValueModal
        open={Boolean(logging)}
        title={logging?.tracker.title ?? ""}
        unit={logging?.tracker.unit || "Amount"}
        onClose={() => setLogging(null)}
        onSave={async (value, note) => {
          if (!logging) return;
          await log(logging, "value", value, note);
        }}
      />

      <PerfectDay
        open={celebrate && Boolean(data?.perfect)}
        count={done.length}
        onClose={() => setCelebrate(false)}
      />
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <section className="mt-3.5">
      <div className="flex items-center justify-between px-4 pb-1">
        <h2 className="text-[13px] font-normal uppercase tracking-[0.04em] text-muted">{title}</h2>
        <span className="text-[13px] font-medium text-muted">{count}</span>
      </div>
      <div className="ios-group check-inset">{children}</div>
    </section>
  );
}
