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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-sheet sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">Log</div>
            <h2 className="text-[20px] font-semibold text-label">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-muted" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <label className="text-[12px] font-medium text-muted">{unit || "Value"}</label>
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-grouped text-ios"
            onClick={() => setValue(String(Math.max(0, (Number(value) || 0) - 1)))}
          >
            <Minus size={16} />
          </button>
          <input
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-12 flex-1 rounded-xl bg-grouped px-3 text-center text-2xl font-semibold text-label outline-none"
          />
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-grouped text-ios"
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
              className="rounded-full bg-grouped px-3 py-1 text-xs font-semibold text-ios"
            >
              +{n}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Note (optional)"
          className="mt-4 h-20 w-full resize-none rounded-xl bg-grouped px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ios py-3 text-[16px] font-semibold text-white disabled:opacity-60"
        >
          <Check size={16} />
          Save
        </button>
      </div>
    </div>
  );
}
