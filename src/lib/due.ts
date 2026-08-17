import {
  addDays,
  daysBetween,
  endOfMonth,
  parseISODate,
  startOfMonth,
  startOfWeek,
  weekday,
} from "./dates";
import type { RepeatKind, Tracker } from "./types";

export function isScheduledOn(tracker: Pick<
  Tracker,
  "startDate" | "endDate" | "archived" | "repeatKind" | "repeatInterval" | "weekdays"
>, date: string): boolean {
  if (tracker.archived) return false;
  if (date < tracker.startDate) return false;
  if (tracker.endDate && date > tracker.endDate) return false;

  if (tracker.repeatKind === "daily") {
    const elapsed = daysBetween(tracker.startDate, date);
    return elapsed >= 0 && elapsed % Math.max(1, tracker.repeatInterval) === 0;
  }

  if (tracker.repeatKind === "weekly") {
    const startWeek = startOfWeek(tracker.startDate);
    const thisWeek = startOfWeek(date);
    const weeks = Math.round(daysBetween(startWeek, thisWeek) / 7);
    if (weeks < 0 || weeks % Math.max(1, tracker.repeatInterval) !== 0) return false;
    if (tracker.weekdays && tracker.weekdays.length > 0) {
      return tracker.weekdays.includes(weekday(date));
    }
    return true;
  }

  const start = parseISODate(tracker.startDate);
  const cur = parseISODate(date);
  const months = (cur.y - start.y) * 12 + (cur.m - start.m);
  if (months < 0 || months % Math.max(1, tracker.repeatInterval) !== 0) return false;
  return true;
}

export function periodBounds(
  date: string,
  kind: RepeatKind,
): { start: string; end: string } {
  if (kind === "daily") return { start: date, end: date };
  if (kind === "weekly") {
    const start = startOfWeek(date);
    return { start, end: addDays(start, 6) };
  }
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function scheduledDays(tracker: Tracker, from: string, to: string): string[] {
  const start = from < tracker.startDate ? tracker.startDate : from;
  const end = tracker.endDate && tracker.endDate < to ? tracker.endDate : to;
  if (start > end) return [];
  const days: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    if (isScheduledOn(tracker, cursor)) days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}
