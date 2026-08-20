"use client";

import { addDays, fromISODate, todayISO } from "@/lib/dates";
import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";

const WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function DateStrip({ date, onChange }: { date: string; onChange: (next: string) => void }) {
  const today = todayISO();
  const days = useMemo(() => {
    const start = addDays(today, -21);
    return Array.from({ length: 29 }, (_, i) => addDays(start, i));
  }, [today]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-day="${date}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [date]);

  return (
    <div ref={scroller} className="no-scrollbar flex gap-2 overflow-x-auto bg-white px-3 py-3">
      {days.map((day) => {
        const dt = fromISODate(day);
        const selected = day === date;
        const isToday = day === today;
        return (
          <button
            key={day}
            type="button"
            data-day={day}
            onClick={() => onChange(day)}
            className="flex w-12 shrink-0 flex-col items-center"
          >
            <span className={clsx("text-[10px] font-semibold", selected ? "text-ios" : "text-muted")}>
              {MONTH[dt.getMonth()]}
            </span>
            <span
              className={clsx(
                "mt-1 flex h-10 w-10 items-center justify-center rounded-full text-[17px] font-semibold",
                selected ? "bg-ios text-white" : "text-label",
              )}
            >
              {dt.getDate()}
            </span>
            <span className={clsx("mt-1 text-[10px] font-semibold", selected ? "text-ios" : "text-muted")}>
              {WEEK[dt.getDay()]}
            </span>
            <span className={clsx("mt-1 h-1.5 w-1.5 rounded-full", selected || isToday ? "bg-ios" : "bg-transparent")} />
          </button>
        );
      })}
    </div>
  );
}
