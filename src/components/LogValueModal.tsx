"use client";

import { Check, X } from "lucide-react";
import { IosGrabber } from "@/components/ios";
import { useEffect, useState } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"] as const;

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

  function typeKey(key: (typeof KEYS)[number]) {
    if (key === "del") {
      setValue((curr) => curr.slice(0, -1));
      return;
    }
    if (key === "." && value.includes(".")) return;
    setValue((curr) => {
      if (key === "." && !curr) return "0.";
      if (curr === "0" && key !== ".") return key;
      return `${curr}${key}`;
    });
  }

  async function submit() {
    const parsed = Number(value || 0);
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
        <div className="mb-2 flex items-start justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">Log</div>
            <h2 className="text-[22px] font-semibold text-label">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-muted press" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="text-center text-[13px] text-muted">{unit || "Value"}</div>
        <div className="mb-2 text-center text-[44px] font-semibold leading-none tracking-tight text-label">
          {value || "0"}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-label={key === "del" ? "Delete" : key}
              onClick={() => typeKey(key)}
              className="flex h-12 items-center justify-center rounded-[10px] bg-grouped text-[22px] font-medium text-label press"
            >
              {key === "del" ? "⌫" : key}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Note (optional)"
          className="mt-3 h-[64px] w-full resize-none rounded-[12px] bg-grouped px-3 py-2.5 text-[15px] outline-none"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] bg-ios py-3.5 text-[17px] font-semibold text-white press disabled:opacity-60"
        >
          <Check size={18} strokeWidth={2.6} />
          Save
        </button>
      </div>
    </div>
  );
}
