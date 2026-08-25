"use client";

import { Check, Minus, Plus, X } from "lucide-react";
import { IosGrabber } from "@/components/ios";
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-[20px] bg-white px-5 pt-2 shadow-sheet sm:rounded-[20px] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <IosGrabber />
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">Log</div>
            <h2 className="text-[22px] font-semibold text-label">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-muted press" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <label className="text-[13px] text-muted">{unit || "Value"}</label>
        <div className="mt-1.5 flex items-center gap-3">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-grouped text-ios press"
            onClick={() => setValue(String(Math.max(0, (Number(value) || 0) - 1)))}
            aria-label="Decrease"
          >
            <Minus size={18} />
          </button>
          <input
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-14 flex-1 rounded-[12px] bg-grouped px-3 text-center text-[34px] font-semibold leading-none text-label outline-none"
          />
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-grouped text-ios press"
            onClick={() => setValue(String((Number(value) || 0) + 1))}
            aria-label="Increase"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="mt-2.5 flex gap-2">
          {[1, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setValue(String((Number(value) || 0) + n))}
              className="rounded-full bg-grouped px-3.5 py-1.5 text-[13px] font-semibold text-ios press"
            >
              +{n}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Note (optional)"
          className="mt-4 h-[76px] w-full resize-none rounded-[12px] bg-grouped px-3 py-2.5 text-[15px] outline-none"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] bg-ios py-3.5 text-[17px] font-semibold text-white press disabled:opacity-60"
        >
          <Check size={18} strokeWidth={2.6} />
          Save
        </button>
      </div>
    </div>
  );
}
