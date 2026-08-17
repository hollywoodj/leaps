"use client";

import { api } from "@/lib/client";
import { EMOJI_SET, TRACKER_COLORS } from "@/lib/colors";
import { addDays, todayISO } from "@/lib/dates";
import type { RepeatKind, Template, TrackerInput, TrackerType } from "@/lib/types";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const TYPES: { id: TrackerType; title: string; body: string }[] = [
  { id: "habit", title: "Habit", body: "Yes/no streaks. Good or bad habits with flexible due days." },
  { id: "target", title: "Target", body: "Hit a number by a date. Pace line shows if you are ahead or behind." },
  { id: "average", title: "Average", body: "Keep a rolling average — sleep, steps, spending, anything numeric." },
  { id: "project", title: "Project", body: "Milestones and a percent complete, with a deadline pace line." },
];

const WEEKDAYS = [
  { n: 0, l: "S" },
  { n: 1, l: "M" },
  { n: 2, l: "T" },
  { n: 3, l: "W" },
  { n: 4, l: "T" },
  { n: 5, l: "F" },
  { n: 6, l: "S" },
];

type Category = { category: string; templates: Template[] };

export function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<TrackerInput>({
    title: "",
    emoji: "🎯",
    type: "habit",
    color: TRACKER_COLORS[7],
    unit: "",
    goalValue: 1,
    isBad: false,
    startDate: todayISO(),
    endDate: null,
    repeatKind: "daily",
    repeatInterval: 1,
    weekdays: null,
    timesPerPeriod: 1,
    notes: "",
    milestones: [],
  });
  const [milestoneText, setMilestoneText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api<{ categories: Category[] }>("/api/templates").then((payload) => setCategories(payload.categories));
  }, []);

  const preview = useMemo(() => form, [form]);

  function applyTemplate(template: Template) {
    setForm({
      title: template.title,
      emoji: template.emoji,
      type: template.type,
      color: template.color,
      unit: template.unit,
      goalValue: template.goalValue,
      isBad: template.isBad,
      startDate: todayISO(),
      endDate: template.endInDays ? addDays(todayISO(), template.endInDays) : null,
      repeatKind: template.repeatKind,
      repeatInterval: template.repeatInterval,
      weekdays: template.weekdays,
      timesPerPeriod: template.timesPerPeriod,
      notes: template.notes,
      milestones: template.milestones?.map((title) => ({ title })) ?? [],
    });
    setStep(2);
  }

  async function save() {
    if (!form.title.trim()) {
      setError("Give this tracker a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await api<{ tracker: { id: string } }>("/api/trackers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      router.push(`/trackers/${created.tracker.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create tracker");
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Step {step} of 3</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        {step === 1 ? "What do you want to track?" : step === 2 ? "Customize it" : "When is it due?"}
      </h1>

      {step === 1 && (
        <div className="mt-6 space-y-8">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Create from scratch</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setForm((curr) => ({
                      ...curr,
                      type: type.id,
                      endDate: type.id === "target" || type.id === "project" ? addDays(todayISO(), 90) : null,
                    }));
                    setStep(2);
                  }}
                  className="card p-4 text-left hover:ring-2 hover:ring-teal/30"
                >
                  <div className="font-semibold">{type.title}</div>
                  <p className="mt-1 text-sm text-muted">{type.body}</p>
                </button>
              ))}
            </div>
          </div>
          {categories.map((group) => (
            <div key={group.category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{group.category}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="card flex items-center gap-2 p-3 text-left hover:ring-2 hover:ring-teal/30"
                  >
                    <span className="text-xl">{template.emoji}</span>
                    <span className="text-sm font-semibold">{template.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="card mt-6 space-y-4 p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Name
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="field mt-1"
              placeholder="e.g. Meditate"
            />
          </label>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Emoji</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {EMOJI_SET.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, emoji })}
                  className={clsx("h-9 w-9 rounded-xl text-lg", form.emoji === emoji ? "bg-stone-200" : "bg-stone-50")}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Color</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRACKER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={clsx("h-7 w-7 rounded-full", form.color === color && "ring-2 ring-offset-2 ring-ink")}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Unit
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="field mt-1"
              placeholder="pages, miles, hours, $"
            />
          </label>
          {form.type === "habit" && (
            <>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={Boolean(form.isBad)}
                  onChange={(e) => setForm({ ...form, isBad: e.target.checked, goalValue: e.target.checked ? 0 : form.goalValue })}
                />
                This is a bad habit I want to limit
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                {form.isBad ? "Max allowed per period" : "Times per period"}
                <input
                  type="number"
                  value={form.isBad ? form.goalValue : form.timesPerPeriod}
                  onChange={(e) =>
                    setForm(
                      form.isBad
                        ? { ...form, goalValue: Number(e.target.value) }
                        : { ...form, timesPerPeriod: Number(e.target.value) },
                    )
                  }
                  className="field mt-1"
                />
              </label>
            </>
          )}
          {(form.type === "target" || form.type === "average") && (
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              {form.type === "target" ? "Goal value" : "Target average"}
              <input
                type="number"
                value={form.goalValue}
                onChange={(e) => setForm({ ...form, goalValue: Number(e.target.value) })}
                className="field mt-1"
              />
            </label>
          )}
          {form.type === "project" && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">Milestones</div>
              <div className="mt-2 flex gap-2">
                <input
                  value={milestoneText}
                  onChange={(e) => setMilestoneText(e.target.value)}
                  className="field"
                  placeholder="Add a milestone"
                />
                <button
                  type="button"
                  className="rounded-xl bg-stone-100 px-3 text-sm font-semibold"
                  onClick={() => {
                    if (!milestoneText.trim()) return;
                    setForm({ ...form, milestones: [...(form.milestones ?? []), { title: milestoneText.trim() }] });
                    setMilestoneText("");
                  }}
                >
                  Add
                </button>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {form.milestones?.map((m, i) => (
                  <li key={`${m.title}-${i}`} className="flex justify-between">
                    {m.title}
                    <button
                      type="button"
                      className="text-xs text-bad"
                      onClick={() => setForm({ ...form, milestones: form.milestones?.filter((_, idx) => idx !== i) })}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl bg-stone-100 py-3 text-sm font-semibold">
              Back
            </button>
            <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl bg-teal py-3 text-sm font-semibold text-white">
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card mt-6 space-y-4 p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Repeat
            <select
              value={form.repeatKind}
              onChange={(e) => setForm({ ...form, repeatKind: e.target.value as RepeatKind })}
              className="field mt-1"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          {form.repeatKind === "weekly" && (
            <div className="flex gap-1">
              {WEEKDAYS.map((d) => {
                const selected = form.weekdays?.includes(d.n);
                return (
                  <button
                    key={d.n}
                    type="button"
                    onClick={() => {
                      const curr = form.weekdays ?? [];
                      const next = curr.includes(d.n) ? curr.filter((x) => x !== d.n) : [...curr, d.n];
                      setForm({ ...form, weekdays: next.length ? next : null });
                    }}
                    className={clsx("h-9 w-9 rounded-full text-xs font-bold", selected ? "bg-ink text-white" : "bg-stone-100")}
                  >
                    {d.l}
                  </button>
                );
              })}
            </div>
          )}
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Start date
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="field mt-1"
            />
          </label>
          {(preview.type === "target" || preview.type === "project") && (
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Deadline
              <input
                type="date"
                value={form.endDate ?? ""}
                onChange={(e) => setForm({ ...form, endDate: e.target.value || null })}
                className="field mt-1"
              />
            </label>
          )}
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="field mt-1 h-20"
            />
          </label>
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl bg-stone-100 py-3 text-sm font-semibold">
              Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="flex-1 rounded-xl bg-teal py-3 text-sm font-semibold text-white"
            >
              Start tracking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
