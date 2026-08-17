"use client";

import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { LineChart } from "@/components/Charts";
import { LogValueModal } from "@/components/LogValueModal";
import { ProgressBar, StatChip } from "@/components/ProgressBar";
import { api } from "@/lib/client";
import { formatPretty, todayISO } from "@/lib/dates";
import { TRACKER_COLORS } from "@/lib/colors";
import type { TrackerDetail as Detail, RepeatKind, Tag, TrackerType } from "@/lib/types";
import clsx from "clsx";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const WEEKDAYS = [
  { n: 0, l: "S" },
  { n: 1, l: "M" },
  { n: 2, l: "T" },
  { n: 3, l: "W" },
  { n: 4, l: "T" },
  { n: 5, l: "F" },
  { n: 6, l: "S" },
];

export function TrackerDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [tab, setTab] = useState<"overview" | "history" | "settings">("overview");
  const [error, setError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);

  const load = useCallback(async () => {
    try {
      const [detail, tagPayload] = await Promise.all([
        api<Detail>(`/api/trackers/${params.id}`),
        api<{ tags: Tag[] }>("/api/tags"),
      ]);
      setData(detail);
      setTags(tagPayload.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Not found");
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div>
        <p className="text-sm text-bad">{error}</p>
        <Link href="/" className="mt-3 inline-block text-sm font-semibold text-teal">Back to Today</Link>
      </div>
    );
  }
  if (!data) return <p className="text-sm text-muted">Loading tracker…</p>;

  const { tracker, progress } = data;
  const date = todayISO();

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted">
        <ArrowLeft size={16} /> Today
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-4xl">{tracker.emoji}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{tracker.title}</h1>
          <p className="mt-1 text-sm capitalize text-muted">{tracker.type}{tracker.isBad ? " · bad habit" : ""}</p>
        </div>
        {tracker.type !== "project" && (
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            className="rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: tracker.color }}
          >
            Log
          </button>
        )}
      </div>

      <div className="card mt-5 p-4">
        <ProgressBar percent={progress.percent} pacePercent={progress.pacePercent} color={tracker.color} onTrack={progress.onTrack} />
        <p className="mt-2 text-sm text-muted">{progress.label}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatChip label="Streak" value={`${progress.streak}d`} />
          <StatChip label="Best" value={`${progress.bestStreak}d`} />
          <StatChip label="Success" value={`${Math.round(progress.successRate * 100)}%`} />
        </div>
      </div>

      <div className="mt-5 flex gap-1 rounded-2xl bg-white p-1 shadow-card">
        {(["overview", "history", "settings"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx("flex-1 rounded-xl px-2 py-2 text-xs font-semibold capitalize", tab === id ? "bg-stone-100" : "text-muted")}
          >
            {id}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-4 space-y-4">
          {tracker.type === "habit" ? (
            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold">Calendar</h2>
              <CalendarHeatmap
                days={data.calendar.map((d) => ({
                  date: d.date,
                  percent: d.status === "skip" ? 0 : d.value > 0 || d.status === "yes" || (tracker.isBad && d.status === "no") ? 100 : d.status === "no" ? 20 : 0,
                }))}
              />
            </div>
          ) : (
            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold">Progress vs pace</h2>
              <LineChart series={data.series} color={tracker.color} />
              <p className="mt-2 text-xs text-muted">Solid line is actual. Dashed line is the pace you need to stay on track.</p>
            </div>
          )}
          {tracker.type === "project" && (
            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold">Milestones</h2>
              <ul className="space-y-2">
                {data.milestones.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 text-left"
                      onClick={async () => {
                        await api(`/api/milestones/${m.id}/toggle`, { method: "POST", body: JSON.stringify({ date }) });
                        await load();
                      }}
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-md border"
                        style={m.completed ? { background: tracker.color, borderColor: tracker.color, color: "white" } : undefined}
                      >
                        {m.completed ? <Check size={12} /> : null}
                      </span>
                      <span className={m.completed ? "text-muted line-through" : ""}>{m.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="mt-4 space-y-2">
          {data.logs.length === 0 && <p className="text-sm text-muted">No logs yet.</p>}
          {data.logs.map((entry) => (
            <div key={entry.id} className="card flex items-center justify-between gap-3 p-3">
              <div>
                <div className="text-sm font-semibold">{formatPretty(entry.date, { month: "short", day: "numeric", year: "numeric" })}</div>
                <div className="text-xs text-muted">
                  {entry.status} · {entry.value}
                  {tracker.unit ? ` ${tracker.unit}` : ""}
                  {entry.note ? ` · ${entry.note}` : ""}
                </div>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-bad"
                onClick={async () => {
                  await api(`/api/logs/${entry.id}`, { method: "DELETE" });
                  await load();
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "settings" && (
        <SettingsForm
          data={data}
          tags={tags}
          onSaved={load}
          onDeleted={() => router.push("/")}
        />
      )}

      <LogValueModal
        open={logOpen}
        title={tracker.title}
        unit={tracker.unit || "Value"}
        onClose={() => setLogOpen(false)}
        onSave={async (value, note) => {
          const status = tracker.type === "habit" ? (value > 0 ? "yes" : "no") : "value";
          await api(`/api/trackers/${tracker.id}/logs`, {
            method: "POST",
            body: JSON.stringify({ date, status, value, note }),
          });
          await load();
        }}
      />
    </div>
  );
}

function SettingsForm({
  data,
  tags,
  onSaved,
  onDeleted,
}: {
  data: Detail;
  tags: Tag[];
  onSaved: () => Promise<void>;
  onDeleted: () => void;
}) {
  const t = data.tracker;
  const [title, setTitle] = useState(t.title);
  const [emoji, setEmoji] = useState(t.emoji);
  const [color, setColor] = useState(t.color);
  const [unit, setUnit] = useState(t.unit);
  const [goalValue, setGoalValue] = useState(String(t.goalValue));
  const [timesPerPeriod, setTimesPerPeriod] = useState(String(t.timesPerPeriod));
  const [repeatKind, setRepeatKind] = useState<RepeatKind>(t.repeatKind);
  const [weekdays, setWeekdays] = useState<number[]>(t.weekdays ?? []);
  const [startDate, setStartDate] = useState(t.startDate);
  const [endDate, setEndDate] = useState(t.endDate ?? "");
  const [notes, setNotes] = useState(t.notes);
  const [isBad, setIsBad] = useState(t.isBad);
  const [tagIds, setTagIds] = useState(data.tags.map((tag) => tag.id));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api(`/api/trackers/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          emoji,
          color,
          unit,
          goalValue: Number(goalValue),
          timesPerPeriod: Number(timesPerPeriod),
          repeatKind,
          weekdays: repeatKind === "weekly" ? weekdays : null,
          startDate,
          endDate: endDate || null,
          notes,
          isBad,
          tagIds,
          type: t.type as TrackerType,
        }),
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card mt-4 space-y-4 p-4">
      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="field" />
      </Field>
      <Field label="Emoji">
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="field" />
      </Field>
      <Field label="Color">
        <div className="flex flex-wrap gap-2">
          {TRACKER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={clsx("h-7 w-7 rounded-full", color === c && "ring-2 ring-offset-2 ring-ink")}
              style={{ background: c }}
            />
          ))}
        </div>
      </Field>
      <Field label="Unit">
        <input value={unit} onChange={(e) => setUnit(e.target.value)} className="field" placeholder="miles, pages, $" />
      </Field>
      <Field label={t.isBad || t.type !== "habit" ? "Goal / limit" : "Times per period"}>
        <input
          value={t.type === "habit" && !t.isBad ? timesPerPeriod : goalValue}
          onChange={(e) => (t.type === "habit" && !t.isBad ? setTimesPerPeriod(e.target.value) : setGoalValue(e.target.value))}
          className="field"
        />
      </Field>
      <Field label="Repeat">
        <select value={repeatKind} onChange={(e) => setRepeatKind(e.target.value as RepeatKind)} className="field">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </Field>
      {repeatKind === "weekly" && (
        <div className="flex gap-1">
          {WEEKDAYS.map((d) => (
            <button
              key={d.n}
              type="button"
              onClick={() => setWeekdays((curr) => (curr.includes(d.n) ? curr.filter((x) => x !== d.n) : [...curr, d.n]))}
              className={clsx("h-9 w-9 rounded-full text-xs font-bold", weekdays.includes(d.n) ? "bg-ink text-white" : "bg-stone-100")}
            >
              {d.l}
            </button>
          ))}
        </div>
      )}
      <Field label="Start">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field" />
      </Field>
      <Field label="Deadline">
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="field" />
      </Field>
      {t.type === "habit" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isBad} onChange={(e) => setIsBad(e.target.checked)} />
          Bad habit (track a limit)
        </label>
      )}
      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="field h-20" />
      </Field>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setTagIds((curr) => (curr.includes(tag.id) ? curr.filter((id) => id !== tag.id) : [...curr, tag.id]))}
              className={clsx("rounded-full px-3 py-1 text-xs font-semibold", tagIds.includes(tag.id) ? "text-white" : "bg-stone-100")}
              style={tagIds.includes(tag.id) ? { background: tag.color } : undefined}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
      <button type="button" disabled={saving} onClick={() => void save()} className="w-full rounded-xl bg-teal py-3 text-sm font-semibold text-white">
        Save settings
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl bg-stone-100 py-2 text-sm font-semibold"
          onClick={async () => {
            await api(`/api/trackers/${t.id}`, { method: "PATCH", body: JSON.stringify({ archived: !t.archived }) });
            await onSaved();
          }}
        >
          {t.archived ? "Unarchive" : "Archive"}
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl bg-stone-100 py-2 text-sm font-semibold"
          onClick={async () => {
            await api(`/api/trackers/${t.id}/start-over`, { method: "POST" });
            await onSaved();
          }}
        >
          Start over
        </button>
      </div>
      <button
        type="button"
        className="w-full text-sm font-semibold text-bad"
        onClick={async () => {
          if (!confirm("Delete this tracker and its logs?")) return;
          await api(`/api/trackers/${t.id}`, { method: "DELETE" });
          onDeleted();
        }}
      >
        Delete tracker
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
