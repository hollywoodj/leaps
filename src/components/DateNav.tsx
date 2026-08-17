"use client";

import { addDays, formatPretty, todayISO } from "@/lib/dates";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function DateNav({ date, onChange }: { date: string; onChange: (next: string) => void }) {
  const today = todayISO();
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onChange(addDays(date, -1))}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-card"
        aria-label="Previous day"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="text-center">
        <div className="text-lg font-semibold tracking-tight">{formatPretty(date)}</div>
        {date !== today && (
          <button type="button" className="text-xs font-semibold text-teal" onClick={() => onChange(today)}>
            Jump to today
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(addDays(date, 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-card"
        aria-label="Next day"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
