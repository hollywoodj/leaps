"use client";

import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { CompareBars, DailyBars, LineChart, RingStat } from "@/components/Charts";
import { IosSpinner, IosSwitch } from "@/components/ios";
import { LogValueModal } from "@/components/LogValueModal";
import { BackButton, HeaderButton, NavHeader } from "@/components/NavHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { SwipeRow } from "@/components/SwipeRow";
import { api } from "@/lib/client";
import { TRACKER_COLORS } from "@/lib/colors";
import { addDays, formatPretty, formatShort, startOfWeek, todayISO } from "@/lib/dates";
import { frequencyLabel } from "@/lib/labels";
import { formatAmount, formatNumber } from "@/lib/stats";
import type { RepeatKind, Tag, TrackerDetail as Detail, TrackerType } from "@/lib/types";
import clsx from "clsx";
import { Check, ChevronRight, Plus, Share } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const WEEKDAYS = [
  { n: 0, l: "S" },
  { n: 1, l: "M" },
  { n: 2, l: "T" },
  { n: 3, l: "W" },
  { n: 4, l: "T" },
  { n: 5, l: "F" },
  { n: 6, l: "S" },
];

const TABS = ["Charts", "History", "Notes", "Settings"] as const;

export function TrackerDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Charts");
  const [error, setError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logDate, setLogDate] = useState(todayISO());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
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
        <NavHeader title="Tracker" left={<BackButton href="/" label="Daily Goals" />} />
        <p className="px-4 py-6 text-sm text-bad">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <NavHeader title="Tracker" left={<BackButton href="/" label="Daily Goals" />} />
        <IosSpinner label="Loading tracker" />
      </div>
    );
  }

  const { tracker, progress, calendar } = data;
  const today = todayISO();

  function openLog(date = today) {
    setLogDate(date);
    setSelectedDay(date);
    setLogOpen(true);
  }

  async function onDaySelect(iso: string) {
    setSelectedDay(iso);
    if (tracker.type === "habit") {
      const day = calendar.find((d) => d.date === iso);
      const complete = Boolean(
        day &&
          (day.status === "yes" ||
            day.value > 0 ||
            (tracker.isBad && day.status === "no")),
      );
      if (complete) {
        await api(`/api/trackers/${tracker.id}/undo`, { method: "POST", body: JSON.stringify({ date: iso }) });
      } else {
        await api(`/api/trackers/${tracker.id}/logs`, {
          method: "POST",
          body: JSON.stringify({ date: iso, status: tracker.isBad ? "no" : "yes", value: 1 }),
        });
      }
      await load();
      return;
    }
    openLog(iso);
  }

  return (
    <div>
      <NavHeader
        title={`${tracker.title} ${tracker.emoji}`}
        subtitle={frequencyLabel(tracker)}
        left={<BackButton href="/" label="Daily Goals" />}
        right={
          <HeaderButton
            label="Share"
            onClick={async () => {
              const text = `${tracker.title}: ${progress.label}`;
              if (navigator.share) await navigator.share({ title: tracker.title, text });
              else await navigator.clipboard.writeText(text);
            }}
          >
            <Share size={18} />
          </HeaderButton>
        }
        tabs={[...TABS]}
        activeTab={tab}
        onTab={(next) => setTab(next as (typeof TABS)[number])}
      />

      {tab === "Charts" && <ChartsPane data={data} selectedDay={selectedDay} onSelectDay={(iso) => void onDaySelect(iso)} onToggleMilestone={async (id) => {
        await api(`/api/milestones/${id}/toggle`, { method: "POST", body: JSON.stringify({ date: today }) });
        await load();
      }} />}
      {tab === "History" && <HistoryPane data={data} onDeleted={load} />}
      {tab === "Notes" && <NotesPane data={data} onSaved={load} />}
      {tab === "Settings" && (
        <SettingsForm data={data} tags={tags} onSaved={load} onDeleted={() => router.push("/")} />
      )}

      {tracker.type !== "project" && tab === "Charts" && (
        <button
          type="button"
          onClick={() => openLog(today)}
          className="fixed z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ios text-white shadow-[0_8px_20px_rgba(0,122,255,0.38)] press"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))", right: "1.25rem" }}
          aria-label="Log"
        >
          <Plus size={28} strokeWidth={2.4} />
        </button>
      )}

      <LogValueModal
        open={logOpen}
        title={tracker.title}
        unit={tracker.unit || "Value"}
        dateLabel={formatPretty(logDate, { weekday: "short", month: "short", day: "numeric" })}
        onClose={() => setLogOpen(false)}
        onSave={async (value, note) => {
          const status = tracker.type === "habit" ? (value > 0 ? "yes" : "no") : "value";
          await api(`/api/trackers/${tracker.id}/logs`, {
            method: "POST",
            body: JSON.stringify({ date: logDate, status, value, note }),
          });
          await load();
        }}
      />
    </div>
  );
}

function ChartsPane({
  data,
  selectedDay,
  onSelectDay,
  onToggleMilestone,
}: {
  data: Detail;
  selectedDay: string | null;
  onSelectDay: (date: string) => void;
  onToggleMilestone: (id: string) => void;
}) {
  const { tracker, progress } = data;
  const recent = data.calendar.slice(-14);
  const weekStart = startOfWeek(todayISO());
  const prevStart = addDays(weekStart, -7);
  const thisWeek = data.calendar.filter((d) => d.date >= weekStart);
  const lastWeek = data.calendar.filter((d) => d.date >= prevStart && d.date < weekStart);
  const avg = (rows: typeof data.calendar) => {
    const logged = rows.filter((d) => d.value > 0 || d.status);
    if (!logged.length) return 0;
    return logged.reduce((s, d) => s + d.value, 0) / logged.length;
  };
  const currentAvg = tracker.type === "average" ? progress.current : avg(thisWeek);
  const previousAvg = avg(lastWeek);

  return (
    <div className="bg-white px-4 py-4">
      {tracker.type === "habit" ? (
        <>
          <CalendarHeatmap
            days={data.calendar.map((d) => ({
              date: d.date,
              percent:
                d.status === "skip"
                  ? 0
                  : d.value > 0 || d.status === "yes" || (tracker.isBad && d.status === "no")
                    ? 100
                    : d.status === "no"
                      ? 20
                      : 0,
            }))}
            selected={selectedDay}
            onSelect={onSelectDay}
          />
          <div className="mt-6 flex items-center justify-between px-2">
            <div className="text-center">
              <div className="text-[12px] font-medium text-ios">Current Streak</div>
              <div className="text-[32px] font-bold leading-none text-label">{progress.streak}</div>
              <div className="text-[12px] text-ios">days</div>
            </div>
            <RingStat
              label={progress.percent >= 100 ? "Goal Met" : "Goal"}
              value={`${Math.round(Math.min(progress.successRate * 100, 100))}%`}
              detail={`${Math.round(progress.successRate * 100) === 100 ? `${progress.streak}/${progress.streak}` : `${Math.round(progress.successRate * 30)}`} days`}
              percent={progress.successRate * 100}
            />
            <div className="text-center">
              <div className="text-[12px] font-medium text-ios">Best Streak</div>
              <div className="text-[32px] font-bold leading-none text-label">{progress.bestStreak}</div>
              <div className="text-[12px] text-ios">days</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 text-[13px] font-semibold text-navy">Last 14 Days</div>
            <DailyBars
              days={recent.map((d) => ({
                date: d.date,
                value: d.value,
                ok: d.status === "yes" || (tracker.isBad && d.status === "no") || d.value >= tracker.timesPerPeriod,
              }))}
              goal={tracker.timesPerPeriod}
            />
          </div>
        </>
      ) : tracker.type === "average" ? (
        <>
          <div className="mb-3 text-center text-[15px] font-semibold text-navy">Average 7 Days</div>
          <CompareBars
            current={currentAvg}
            previous={previousAvg}
            currentLabel={`${formatNumber(currentAvg)} avg / day`}
            previousLabel={`${formatNumber(previousAvg)} avg / day`}
            currentRange={`${formatShort(weekStart)} - ${formatShort(todayISO())}`}
            previousRange={`${formatShort(prevStart)} - ${formatShort(addDays(weekStart, -1))}`}
          />
          <div className="mt-6 flex items-center justify-between px-2">
            <div className="text-center">
              <div className="text-[12px] font-medium text-ios">Current Streak</div>
              <div className="text-[32px] font-bold leading-none">{progress.streak}</div>
              <div className="text-[12px] text-ios">days</div>
            </div>
            <RingStat
              label="Average"
              value={formatNumber(progress.current)}
              detail={progress.onTrack ? `${formatNumber(Math.max(0, progress.current - progress.goal))} over` : `${formatNumber(Math.max(0, progress.goal - progress.current))} under`}
              percent={progress.percent}
              positive={progress.onTrack}
            />
            <div className="text-center">
              <div className="text-[12px] font-medium text-ios">Success Rate</div>
              <div className="text-[32px] font-bold leading-none">{Math.round(progress.successRate * 100)}%</div>
              <div className="text-[12px] text-muted">{Math.round(progress.successRate * 30)}/30 days</div>
            </div>
          </div>
          <div className="mt-6">
            <CalendarHeatmap
              days={data.calendar.map((d) => ({
                date: d.date,
                percent: tracker.goalValue > 0 ? Math.min(100, (d.value / tracker.goalValue) * 100) : d.value > 0 ? 100 : 0,
              }))}
              selected={selectedDay}
              onSelect={onSelectDay}
            />
          </div>
          <div className="mt-6">
            <div className="mb-2 text-[13px] font-semibold text-navy">Last 14 Days</div>
            <DailyBars
              days={recent.map((d) => ({ date: d.date, value: d.value, ok: tracker.isBad ? d.value <= tracker.goalValue : d.value >= tracker.goalValue }))}
              goal={tracker.goalValue}
            />
          </div>
        </>
      ) : tracker.type === "project" ? (
        <div>
          <ProgressBar percent={progress.percent} pacePercent={progress.pacePercent} onTrack={progress.onTrack} />
          <p className="mt-2 text-sm text-muted">{progress.label}</p>
          <ul className="mt-4 space-y-3">
            {data.milestones.map((m) => (
              <li key={m.id}>
                <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => onToggleMilestone(m.id)}>
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full border"
                    style={m.completed ? { background: "#34c759", borderColor: "#34c759", color: "white" } : undefined}
                  >
                    {m.completed ? <Check size={14} /> : null}
                  </span>
                  <span className="flex-1">
                    <span className={clsx("block text-[15px]", m.completed && "text-muted line-through")}>{m.title}</span>
                    {m.dueDate && <span className="text-[12px] text-ios">{formatPretty(m.dueDate)}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <ProgressBar percent={progress.percent} pacePercent={progress.pacePercent} onTrack={progress.onTrack} />
          <p className="mt-2 text-sm text-muted">{progress.label} · {progress.onTrack ? "On pace" : "Behind pace"}</p>
          <div className="mt-4">
            <CalendarHeatmap
              days={data.calendar.map((d) => ({
                date: d.date,
                percent: tracker.goalValue > 0 ? Math.min(100, (d.value / tracker.goalValue) * 100) : d.value > 0 ? 100 : 0,
              }))}
              selected={selectedDay}
              onSelect={onSelectDay}
            />
          </div>
          <div className="mt-4">
            <LineChart series={data.series} color={tracker.color} />
            <p className="mt-2 text-[12px] text-muted">Solid line is actual. Dashed line is the pace you need to stay on track.</p>
          </div>
        </>
      )}
    </div>
  );
}

function HistoryPane({ data, onDeleted }: { data: Detail; onDeleted: () => Promise<void> }) {
  const { tracker } = data;
  return (
    <div className="ios-inset">
      {data.logs.length === 0 && <p className="px-4 py-8 text-center text-[15px] text-muted">No logs yet.</p>}
      {data.logs.map((entry) => (
        <SwipeRow
          key={entry.id}
          enabled={false}
          onDelete={async () => {
            await api(`/api/logs/${entry.id}`, { method: "DELETE" });
            await onDeleted();
          }}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <div className="text-[15px] font-semibold">{formatPretty(entry.date, { month: "short", day: "numeric", year: "numeric" })}</div>
              <div className="text-[13px] text-muted">
                {entry.status === "skip" ? "Skipped" : entry.status === "yes" ? "Yes" : entry.status === "no" ? "No" : formatAmount(entry.value, tracker.unit)}
                {entry.note ? ` · ${entry.note}` : ""}
              </div>
            </div>
          </div>
        </SwipeRow>
      ))}
    </div>
  );
}

function NotesPane({ data, onSaved }: { data: Detail; onSaved: () => Promise<void> }) {
  const [notes, setNotes] = useState(data.tracker.notes);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const savedRef = useRef(data.tracker.notes);

  useEffect(() => {
    setNotes(data.tracker.notes);
    savedRef.current = data.tracker.notes;
  }, [data.tracker.id, data.tracker.notes]);

  useEffect(() => {
    if (notes === savedRef.current) return;
    setStatus("saving");
    const t = window.setTimeout(() => {
      void (async () => {
        await api(`/api/trackers/${data.tracker.id}`, { method: "PATCH", body: JSON.stringify({ notes }) });
        savedRef.current = notes;
        setStatus("saved");
        await onSaved();
      })();
    }, 450);
    return () => window.clearTimeout(t);
  }, [notes, data.tracker.id, onSaved]);

  return (
    <div className="bg-grouped px-0 py-4">
      <div className="ios-inset px-4 py-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note about this goal…"
          className="h-52 w-full resize-none bg-transparent text-[17px] leading-6 outline-none"
        />
      </div>
      <p className="px-8 pt-2 text-[13px] text-muted">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Notes save automatically"}
      </p>
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
    <div className="space-y-6 bg-grouped pb-8 pt-4">
      <Group>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="field-ios" />
        </Field>
        <Field label="Emoji">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="field-ios" />
        </Field>
        <div className="px-4 py-3">
          <div className="mb-2 text-[13px] text-muted">Color</div>
          <div className="flex flex-wrap gap-2">
            {TRACKER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={clsx("h-7 w-7 rounded-full", color === c && "ring-2 ring-offset-2 ring-ios")}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </Group>
      <Group>
        <Field label="Unit">
          <input value={unit} onChange={(e) => setUnit(e.target.value)} className="field-ios" placeholder="miles, pages, $" />
        </Field>
        <Field label={t.isBad || t.type !== "habit" ? "Goal / limit" : "Times per period"}>
          <input
            value={t.type === "habit" && !t.isBad ? timesPerPeriod : goalValue}
            onChange={(e) => (t.type === "habit" && !t.isBad ? setTimesPerPeriod(e.target.value) : setGoalValue(e.target.value))}
            className="field-ios"
          />
        </Field>
        <Field label="Repeat">
          <select value={repeatKind} onChange={(e) => setRepeatKind(e.target.value as RepeatKind)} className="field-ios text-ios">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </Field>
        {repeatKind === "weekly" && (
          <div className="flex justify-between gap-1 px-4 py-3">
            {WEEKDAYS.map((d) => (
              <button
                key={d.n}
                type="button"
                onClick={() => setWeekdays((curr) => (curr.includes(d.n) ? curr.filter((x) => x !== d.n) : [...curr, d.n]))}
                className={clsx("h-9 w-9 rounded-full text-[13px] font-bold press", weekdays.includes(d.n) ? "bg-ios text-white" : "bg-grouped")}
              >
                {d.l}
              </button>
            ))}
          </div>
        )}
        <Field label="Start">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field-ios text-ios" />
        </Field>
        <Field label="Deadline">
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="field-ios text-ios" />
        </Field>
        {t.type === "habit" && (
          <label className="flex items-center justify-between px-4 py-3 text-[15px]">
            Bad habit
            <IosSwitch checked={isBad} label="Bad habit" onChange={setIsBad} />
          </label>
        )}
      </Group>
      {tags.length > 0 && (
        <Group>
          <div className="flex flex-wrap gap-2 px-4 py-3">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setTagIds((curr) => (curr.includes(tag.id) ? curr.filter((id) => id !== tag.id) : [...curr, tag.id]))}
                className={clsx("rounded-full px-3 py-1 text-xs font-semibold", tagIds.includes(tag.id) ? "text-white" : "bg-grouped")}
                style={tagIds.includes(tag.id) ? { background: tag.color } : undefined}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </Group>
      )}
      <div className="px-4">
        <button type="button" disabled={saving} onClick={() => void save()} className="w-full rounded-[12px] bg-ios py-3.5 text-[17px] font-semibold text-white press">
          Save
        </button>
      </div>
      <Group>
        <button
          type="button"
          className="w-full px-4 py-3 text-left text-[17px] text-ios press"
          onClick={async () => {
            await api(`/api/trackers/${t.id}`, { method: "PATCH", body: JSON.stringify({ archived: !t.archived }) });
            await onSaved();
          }}
        >
          {t.archived ? "Unarchive" : "Archive"}
        </button>
        <button
          type="button"
          className="w-full px-4 py-3 text-left text-[17px] text-ios press"
          onClick={async () => {
            await api(`/api/trackers/${t.id}/start-over`, { method: "POST" });
            await onSaved();
          }}
        >
          Start Over
        </button>
        <button
          type="button"
          className="w-full px-4 py-3 text-left text-[17px] text-bad press"
          onClick={async () => {
            if (!confirm("Delete this tracker and its logs?")) return;
            await api(`/api/trackers/${t.id}`, { method: "DELETE" });
            onDeleted();
          }}
        >
          Delete Tracker
        </button>
      </Group>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="ios-inset divide-y divide-[rgba(60,60,67,0.12)]">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 px-4 py-3 text-[15px]">
      <span className="shrink-0 text-muted">{label}</span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        {children}
        <ChevronRight size={16} className="shrink-0 text-[#c7c7cc]" />
      </div>
    </label>
  );
}
