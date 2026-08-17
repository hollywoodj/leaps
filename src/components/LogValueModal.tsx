"use client";

import { Check, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

export function LogValueModal({
  open,
  title,
  unit,
  initial = 0,
  note = "",
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  unit: string;
  initial?: number;
  note?: string;
  onClose: () => void;
  onSave: (value: number, note: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState(String(initial || ""));
  const [text, setText] = useState(note);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(initial ? String(initial) : "");
      setText(note);
    }
  }, [open, initial, note]);

  if (!open) return null;

  async function submit() {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    setSaving(true);
    try {
      await onSave(parsed, text);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="card w-full max-w-md p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Log</div>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-muted hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>
        <label className="text-xs font-medium text-muted">{unit || "Value"}</label>
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100"
            onClick={() => setValue(String(Math.max(0, (Number(value) || 0) - 1)))}
          >
            <Minus size={16} />
          </button>
          <input
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-11 flex-1 rounded-xl border border-stone-200 px-3 text-center text-lg font-semibold outline-none focus:border-teal"
          />
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100"
            onClick={() => setValue(String((Number(value) || 0) + 1))}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          {[1, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setValue(String((Number(value) || 0) + n))}
              className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold"
            >
              +{n}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Note (optional)"
          className="mt-4 h-20 w-full resize-none rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-teal"
        />
        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Check size={16} />
          Save log
        </button>
      </div>
    </div>
  );
}
