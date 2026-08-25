"use client";

import { IosSwitch } from "@/components/ios";
import { BackButton, HeaderButton, NavHeader } from "@/components/NavHeader";
import { api } from "@/lib/client";
import { EMOJI_SET, TRACKER_COLORS } from "@/lib/colors";
import { addDays, todayISO } from "@/lib/dates";
import { typeCopy } from "@/lib/labels";
import type { RepeatKind, Template, TrackerInput, TrackerType } from "@/lib/types";
import clsx from "clsx";
import { BarChart3, Check, ChevronRight, SlidersHorizontal, SquareCheck, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TYPES: { id: TrackerType; icon: typeof SquareCheck }[] = [
  { id: "habit", icon: SquareCheck },
  { id: "target", icon: TrendingUp },
  { id: "average", icon: BarChart3 },
  { id: "project", icon: SlidersHorizontal },
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

  const copy = typeCopy(form.type);

  return (
    <div className="min-h-full bg-grouped">
      <NavHeader
        title="Add Tracker"
        subtitle={`Step ${step} of 3`}
        left={
          step === 1 ? (
            <BackButton href="/" label="Daily Goals" />
          ) : (
            <BackButton
              label="Back"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            />
          )
        }
        right={
          step < 3 ? (
            <HeaderButton label="Next" onClick={() => setStep((s) => (s === 1 ? 2 : 3))}>
              <ChevronRight size={26} />
            </HeaderButton>
          ) : (
            <HeaderButton label="Save" onClick={() => void save()}>
              <Check size={22} />
            </HeaderButton>
          )
        }
      />

      {step === 1 && (
        <div className="pb-8">
          <div className="ios-group">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left press"
          >
            <span className="text-[17px] font-semibold text-ios">Create Tracker</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
          </div>
          {categories.map((group) => (
            <div key={group.category}>
              <h2 className="ios-section !pt-3">{group.category}</h2>
              <div className="ios-group divide-y divide-[rgba(60,60,67,0.12)]">
                {group.templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left press"
                  >
                    <span className="text-xl">{template.emoji}</span>
                    <span className="flex-1 text-[16px] font-medium text-label">{template.title}</span>
                    <span className="text-[12px] capitalize text-muted">{template.type}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Tracker Name"
            className="w-full border-b border-black/[0.08] px-4 py-4 text-[20px] font-semibold text-label outline-none placeholder:text-muted"
          />
          <p className="px-4 py-3 text-center text-[14px] text-muted">How do you want to track this?</p>
          <div className="divide-y divide-black/[0.06]">
            {TYPES.map((type) => {
              const info = typeCopy(type.id);
              const selected = form.type === type.id;
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setForm((curr) => ({
                      ...curr,
                      type: type.id,
                      endDate: type.id === "target" || type.id === "project" ? curr.endDate || addDays(todayISO(), 90) : curr.endDate,
                    }));
                  }}
                  className="flex w-full items-center gap-3 px-4 py-[13px] text-left press"
                >
                  <Icon size={22} className={selected ? "text-good" : "text-navy"} />
                  <span className="flex-1">
                    <span className={clsx("block text-[16px] font-semibold", selected ? "text-good" : "text-label")}>{info.title}</span>
                    <span className="text-[13px] text-muted">{info.subtitle}</span>
                  </span>
                  {selected && <Check size={18} className="text-good" />}
                </button>
              );
            })}
          </div>
          <div className="mt-6 px-4 pb-8">
            <div className="text-center text-[13px] font-bold uppercase tracking-wide text-navy">{copy.title}</div>
            <div className="mt-1 text-center text-[13px] italic text-muted">{copy.examples}</div>
            <div className="mt-4 rounded-xl border border-black/10 p-4">
              <label className="text-[12px] font-semibold uppercase tracking-wide text-muted">Emoji</label>
              <div className="mt-2 flex flex-wrap gap-1">
                {EMOJI_SET.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm({ ...form, emoji })}
                    className={clsx("h-9 w-9 rounded-lg text-lg", form.emoji === emoji ? "bg-fill" : "bg-grouped")}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <label className="mt-4 block text-[12px] font-semibold uppercase tracking-wide text-muted">Color</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRACKER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={clsx("h-7 w-7 rounded-full", form.color === color && "ring-2 ring-offset-2 ring-ios")}
                    style={{ background: color }}
                  />
                ))}
              </div>
              {form.type === "habit" && (
                <>
                  <label className="mt-4 flex items-center justify-between text-[15px]">
                    <span>Bad habit I want to limit</span>
                    <IosSwitch
                      checked={Boolean(form.isBad)}
                      label="Bad habit"
                      onChange={(checked) => setForm({ ...form, isBad: checked, goalValue: checked ? 0 : form.goalValue })}
                    />
                  </label>
                  <label className="mt-3 block text-[12px] font-semibold uppercase tracking-wide text-muted">
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
                      className="field-ios mt-1 w-full text-left"
                    />
                  </label>
                </>
              )}
              {(form.type === "target" || form.type === "average") && (
                <label className="mt-3 block text-[12px] font-semibold uppercase tracking-wide text-muted">
                  {form.type === "target" ? "Goal value" : "Target average"}
                  <input
                    type="number"
                    value={form.goalValue}
                    onChange={(e) => setForm({ ...form, goalValue: Number(e.target.value) })}
                    className="field-ios mt-1 w-full text-left"
                  />
                </label>
              )}
              {form.type === "project" && (
                <div className="mt-3">
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">Milestones</div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={milestoneText}
                      onChange={(e) => setMilestoneText(e.target.value)}
                      className="field-ios flex-1 text-left"
                      placeholder="Add a milestone"
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-grouped px-3 text-sm font-semibold text-ios"
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
              <label className="mt-3 block text-[12px] font-semibold uppercase tracking-wide text-muted">
                Unit
                <input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="field-ios mt-1 w-full text-left"
                  placeholder="pages, miles, hours, $"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-grouped pb-10">
          <h2 className="ios-section">Repeat</h2>
          <div className="ios-group divide-y divide-[rgba(60,60,67,0.12)]">
          <label className="flex items-center justify-between px-4 py-3 text-[15px]">
            <span className="text-muted">Repeat</span>
            <select
              value={form.repeatKind}
              onChange={(e) => setForm({ ...form, repeatKind: e.target.value as RepeatKind })}
              className="field-ios text-ios"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          {form.repeatKind === "weekly" && (
            <div className="flex justify-between gap-1 px-4 py-3">
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
                    className={clsx("h-9 w-9 rounded-full text-[13px] font-bold press", selected ? "bg-ios text-white" : "bg-grouped text-label")}
                  >
                    {d.l}
                  </button>
                );
              })}
            </div>
          )}
          <label className="flex items-center justify-between px-4 py-3 text-[15px]">
            <span className="text-muted">Start date</span>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="field-ios text-ios"
            />
          </label>
          {(form.type === "target" || form.type === "project") && (
            <label className="flex items-center justify-between px-4 py-3 text-[15px]">
              <span className="text-muted">Deadline</span>
              <input
                type="date"
                value={form.endDate ?? ""}
                onChange={(e) => setForm({ ...form, endDate: e.target.value || null })}
                className="field-ios text-ios"
              />
            </label>
          )}
          </div>
          <h2 className="ios-section">Notes</h2>
          <div className="ios-group px-4 py-3">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Why this goal matters…"
              className="h-24 w-full resize-none bg-transparent text-[15px] outline-none"
            />
          </div>
          {error && <p className="px-4 py-3 text-sm text-bad">{error}</p>}
          <div className="px-4 py-5">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="w-full rounded-[12px] bg-ios py-3.5 text-[17px] font-semibold text-white press disabled:opacity-60"
            >
              Start Tracking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
