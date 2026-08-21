"use client";

import { addMonths, eachDay, endOfMonth, fromISODate, startOfMonth, weekday } from "@/lib/dates";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarHeatmap({
  days,
  onSelect,
}: {
  days: { date: string; percent: number; due?: number; value?: number }[];
  onSelect?: (date: string) => void;
}) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const fallback = days[days.length - 1]?.date ?? days[0]?.date;
  const [month, setMonth] = useState(fallback ? startOfMonth(fallback) : startOfMonth(new Date().toISOString().slice(0, 10)));

  const cells = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const pad = weekday(start);
    const dates = eachDay(start, end);
    return [...Array.from({ length: pad }, () => null), ...dates];
  }, [month]);

  const label = fromISODate(month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => setMonth(addMonths(month, -1))} className="p-1 text-ios" aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <div className="text-[16px] font-semibold text-navy">{label}</div>
        <button type="button" onClick={() => setMonth(addMonths(month, 1))} className="p-1 text-ios" aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium text-ios/70">
        {DOW.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const cell = byDate.get(date);
          const percent = cell?.percent ?? 0;
          const complete = percent >= 100;
          const partial = percent > 0 && percent < 100;
          return (
            <button
              key={date}
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(date)}
              className="flex items-center justify-center py-0.5 disabled:cursor-default disabled:opacity-100"
            >
              <span
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-medium",
                  complete && "bg-good text-white",
                  partial && "bg-good/25 text-label",
                  !complete && !partial && "text-label",
                )}
              >
                {fromISODate(date).getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
