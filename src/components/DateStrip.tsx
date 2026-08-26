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
    <div className="hairline bg-white">
      <div className="flex items-end">
        <div className="flex w-[52px] shrink-0 flex-col items-center pb-[11px] pt-1.5">
          <span className="h-[13px]" />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center text-ios press"
            aria-label="Jump to date"
            onClick={() => {
              const input = picker.current;
              if (!input) return;
              if (typeof input.showPicker === "function") input.showPicker();
              else input.click();
            }}
          >
            <CalendarDays size={22} strokeWidth={1.8} />
          </button>
          {date !== today ? (
            <button
              type="button"
              className="mt-0.5 text-[10px] font-semibold text-ios"
              onClick={() => onChange(today)}
            >
              Today
            </button>
          ) : (
            <span className="mt-1 h-1.5 w-1.5" />
          )}
        </div>
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
        <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex gap-1.5 overflow-x-auto py-1.5 pr-3">
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
                className="flex w-[46px] shrink-0 flex-col items-center press"
              >
                <span className={clsx("text-[10px] font-semibold tracking-wide", selected ? "text-ios" : "text-muted")}>
                  {MONTH[dt.getMonth()]}
                </span>
                <span
                  className={clsx(
                    "mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-[17px] font-semibold",
                    selected ? "bg-ios text-white" : "text-label",
                  )}
                >
                  {dt.getDate()}
                </span>
                <span className={clsx("mt-0.5 text-[10px] font-semibold tracking-wide", selected ? "text-ios" : "text-muted")}>
                  {WEEK[dt.getDay()]}
                </span>
                <span className={clsx("mt-1 h-1.5 w-1.5 rounded-full", isToday ? "bg-ios" : "bg-transparent")} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
