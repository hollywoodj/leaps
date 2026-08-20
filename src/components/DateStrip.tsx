"use client";

import { addDays, eachDay, fromISODate, todayISO } from "@/lib/dates";
import clsx from "clsx";
import { CalendarDays } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const PAGE = 30;
const MAX_PAST_DAYS = 365 * 10;
const MAX_FUTURE_DAYS = 365;

export function DateStrip({ date, onChange }: { date: string; onChange: (next: string) => void }) {
  const today = todayISO();
  const minDate = addDays(today, -MAX_PAST_DAYS);
  const maxDate = addDays(today, MAX_FUTURE_DAYS);
  const [from, setFrom] = useState(() => addDays(date, -45));
  const [to, setTo] = useState(() => addDays(today, 14));
  const scroller = useRef<HTMLDivElement>(null);
  const prependWidth = useRef(0);
  const picker = useRef<HTMLInputElement>(null);

  const days = useMemo(() => eachDay(from < minDate ? minDate : from, to > maxDate ? maxDate : to), [from, to, minDate, maxDate]);

  useEffect(() => {
    if (date < from) setFrom(addDays(date, -PAGE) < minDate ? minDate : addDays(date, -PAGE));
    if (date > to) setTo(addDays(date, PAGE) > maxDate ? maxDate : addDays(date, PAGE));
  }, [date, from, to, minDate, maxDate]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !prependWidth.current) return;
    el.scrollLeft += el.scrollWidth - prependWidth.current;
    prependWidth.current = 0;
  }, [from]);

  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-day="${date}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [date, days.length]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    if (el.scrollLeft < 80 && from > minDate) {
      prependWidth.current = el.scrollWidth;
      const next = addDays(from, -PAGE);
      setFrom(next < minDate ? minDate : next);
    }
    if (el.scrollLeft + el.clientWidth > el.scrollWidth - 80 && to < maxDate) {
      const next = addDays(to, PAGE);
      setTo(next > maxDate ? maxDate : next);
    }
  }

  return (
    <div className="bg-white">
      <div className="flex items-center gap-1 px-3 pt-2">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ios"
          aria-label="Jump to date"
          onClick={() => {
            const input = picker.current;
            if (!input) return;
            if (typeof input.showPicker === "function") input.showPicker();
            else input.click();
          }}
        >
          <CalendarDays size={18} />
        </button>
        <input
          ref={picker}
          type="date"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          className="sr-only"
          aria-label="Choose date"
        />
        {date !== today && (
          <button
            type="button"
            className="rounded-full bg-ios/10 px-2.5 py-1 text-[11px] font-semibold text-ios"
            onClick={() => onChange(today)}
          >
            Today
          </button>
        )}
      </div>
      <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3 pt-1">
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
    </div>
  );
}
