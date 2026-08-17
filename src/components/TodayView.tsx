"use client";

import { DateNav } from "@/components/DateNav";
import { LogValueModal } from "@/components/LogValueModal";
import { TrackerCard } from "@/components/TrackerCard";
import { api } from "@/lib/client";
import { todayISO } from "@/lib/dates";
import type { TodayItem } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

  const load = useCallback(async () => {
    setError(null);
    try {
      const next = await api<TodayResponse>(`/api/today?date=${date}`);
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load today");
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const empty = data && data.due.length + data.done.length + data.missed.length === 0;

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Daily Goals</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Today</h1>
        <p className="mt-1 text-sm text-muted">Log what is due. Land everything in Done for a perfect day.</p>
      </header>

      <DateNav date={date} onChange={setDate} />

      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-bad">{error}</p>}

      {!data && !error && <p className="mt-8 text-sm text-muted">Loading your trackers…</p>}

      {data?.perfect && (
        <div className="mt-6 rounded-2xl bg-teal px-4 py-3 text-white shadow-card">
          <div className="font-semibold">Perfect day</div>
          <p className="text-sm text-teal-100">Every due tracker is in Done. That is a leap.</p>
        </div>
      )}

      {empty && (
        <div className="card mt-6 p-6 text-center">
          <div className="text-3xl">🎯</div>
          <h2 className="mt-3 text-lg font-semibold">Nothing due on this day</h2>
          <p className="mt-1 text-sm text-muted">Create a habit, target, average, or project to start tracking.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/create" className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white">
              Create tracker
            </Link>
            <button
              type="button"
              className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold"
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

      {data && (
        <div className="mt-6 space-y-8">
          <Section title="Due" count={data.due.length} empty="All caught up.">
            {data.due.map((item) => (
              <TrackerCard
                key={item.tracker.id}
                item={item}
                onYes={() => void log(item, item.tracker.isBad ? "no" : "yes")}
                onNo={() => void log(item, item.tracker.isBad ? "yes" : "no")}
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
          <Section title="Missed" count={data.missed.length}>
            {data.missed.map((item) => (
              <TrackerCard
                key={item.tracker.id}
                item={item}
                onYes={() => undefined}
                onNo={() => undefined}
                onSkip={() => undefined}
                onUndo={() => void undo(item)}
                onLog={() => setLogging(item)}
                onToggleMilestone={() => undefined}
              />
            ))}
          </Section>
          <Section title="Done" count={data.done.length}>
            {data.done.map((item) => (
              <TrackerCard
                key={item.tracker.id}
                item={item}
                onYes={() => undefined}
                onNo={() => undefined}
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
    </div>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty?: string;
  children: React.ReactNode;
}) {
  if (count === 0 && !empty) return null;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
        <span className="text-xs font-semibold text-muted">{count}</span>
      </div>
      <div className="space-y-3">{count ? children : <p className="text-sm text-muted">{empty}</p>}</div>
    </section>
  );
}
