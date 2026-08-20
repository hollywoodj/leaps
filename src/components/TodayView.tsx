"use client";

import { DateStrip } from "@/components/DateStrip";
import { HeaderButton, NavHeader } from "@/components/NavHeader";
import { LogValueModal } from "@/components/LogValueModal";
import { PerfectDay } from "@/components/PerfectDay";
import { TrackerCard } from "@/components/TrackerCard";
import { api } from "@/lib/client";
import { todayISO } from "@/lib/dates";
import type { Tag, TodayItem } from "@/lib/types";
import { Settings2, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type TodayResponse = {
  date: string;
  due: TodayItem[];
  done: TodayItem[];
  missed: TodayItem[];
  perfect: boolean;
};

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
    await api(`/api/trackers/${item.tracker.id}/logs`, {
      method: "POST",
      body: JSON.stringify({ date, status, value, note }),
    });
    await load();
  }

  async function undo(item: TodayItem) {
    await api(`/api/trackers/${item.tracker.id}/undo`, {
      method: "POST",
      body: JSON.stringify({ date }),
    });
    await load();
  }

  const filtered = (items: TodayItem[]) =>
    tagId ? items.filter((item) => item.tags.some((tag) => tag.id === tagId)) : items;

  const due = filtered(data?.due ?? []);
  const missed = filtered(data?.missed ?? []);
  const done = filtered(data?.done ?? []);
  const empty = data && due.length + done.length + missed.length === 0;

  return (
    <div>
      <NavHeader
        title="Today"
        menu={[
          { href: "/", label: "Today" },
          { href: "/reports", label: "Reports" },
        ]}
        left={
          <HeaderButton href="/settings" label="Settings">
            <Settings2 size={22} />
          </HeaderButton>
        }
        right={
          <HeaderButton onClick={() => setFilterOpen((v) => !v)} label="Filter">
            <SlidersHorizontal size={20} />
          </HeaderButton>
        }
      />

      <DateStrip date={date} onChange={setDate} />

      {filterOpen && (
        <div className="flex flex-wrap gap-2 border-b border-black/5 bg-white px-4 py-3">
          <FilterChip active={!tagId} onClick={() => setTagId("")}>
            All
          </FilterChip>
          {tags.map((tag) => (
            <FilterChip key={tag.id} active={tagId === tag.id} onClick={() => setTagId(tag.id)} color={tag.color}>
              {tag.name}
            </FilterChip>
          ))}
        </div>
      )}

      {error && <p className="px-4 py-3 text-sm text-bad">{error}</p>}
      {!data && !error && <p className="px-4 py-8 text-center text-sm text-muted">Loading your trackers…</p>}

      {empty && (
        <div className="mx-4 mt-8 rounded-2xl bg-white px-5 py-10 text-center shadow-card">
          <div className="text-4xl">🎯</div>
          <h2 className="mt-3 text-lg font-semibold">Nothing due on this day</h2>
          <p className="mt-1 text-sm text-muted">Create a habit, target, average, or project to start tracking.</p>
          <div className="mt-5 flex justify-center gap-2">
            <a href="/create" className="rounded-full bg-ios px-4 py-2 text-sm font-semibold text-white">
              Create tracker
            </a>
            <button
              type="button"
              className="rounded-full bg-fill px-4 py-2 text-sm font-semibold"
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
        <div className="pb-4">
          <Section title="Due" count={due.length}>
            {due.map((item) => (
              <TrackerCard
                key={item.tracker.id}
                item={item}
                onYes={() => void log(item, item.tracker.isBad ? "no" : "yes")}
                onSkip={() => void log(item, "skip")}
                onUndo={() => void undo(item)}
                onLog={() => setLogging(item)}
                onToggleMilestone={async (id) => {
                  await api(`/api/milestones/${id}/toggle`, { method: "POST", body: JSON.stringify({ date }) });
                  await load();
                }}
              />
            ))}
          </Section>
          <Section title="Missed" count={missed.length}>
            {missed.map((item) => (
              <TrackerCard
                key={item.tracker.id}
                item={item}
                onYes={() => undefined}
                onSkip={() => undefined}
                onUndo={() => void undo(item)}
                onLog={() => setLogging(item)}
                onToggleMilestone={() => undefined}
              />
            ))}
          </Section>
          <Section title="Done" count={done.length}>
            {done.map((item) => (
              <TrackerCard
                key={item.tracker.id}
                item={item}
                onYes={() => undefined}
                onSkip={() => undefined}
                onUndo={() => void undo(item)}
                onLog={() => setLogging(item)}
                onToggleMilestone={async (id) => {
                  await api(`/api/milestones/${id}/toggle`, { method: "POST", body: JSON.stringify({ date }) });
                  await load();
                }}
              />
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
    <section className="mt-4">
      <div className="flex items-center justify-between px-4 pb-1.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{title}</h2>
        <span className="text-[12px] font-semibold text-muted">{count}</span>
      </div>
      <div className="divide-y divide-black/[0.06] border-y border-black/[0.06] bg-white">{children}</div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-1 text-[12px] font-semibold"
      style={
        active
          ? { background: color || "#007aff", color: "white" }
          : { background: "#f2f2f7", color: "#163a73" }
      }
    >
      {children}
    </button>
  );
}
