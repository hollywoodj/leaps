export function todayISO(now = new Date()): string {
  return toISODate(now);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date: ${iso}`);
  return { y, m, d };
}

export function fromISODate(iso: string): Date {
  const { y, m, d } = parseISODate(iso);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const dt = fromISODate(iso);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

export function weekday(iso: string): number {
  return fromISODate(iso).getDay();
}

export function daysBetween(from: string, to: string): number {
  const a = parseISODate(from);
  const b = parseISODate(to);
  const t1 = Date.UTC(a.y, a.m - 1, a.d);
  const t2 = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((t2 - t1) / 86_400_000);
}

export function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function clampDate(iso: string, min: string, max: string): string {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
}

export function startOfWeek(iso: string, weekStartsOn = 1): string {
  const wd = weekday(iso);
  const diff = (wd - weekStartsOn + 7) % 7;
  return addDays(iso, -diff);
}

export function endOfWeek(iso: string, weekStartsOn = 1): string {
  return addDays(startOfWeek(iso, weekStartsOn), 6);
}

export function startOfMonth(iso: string): string {
  const { y, m } = parseISODate(iso);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

export function endOfMonth(iso: string): string {
  const { y, m } = parseISODate(iso);
  return toISODate(new Date(y, m, 0));
}

export function startOfYear(iso: string): string {
  return `${parseISODate(iso).y}-01-01`;
}

export function endOfYear(iso: string): string {
  return `${parseISODate(iso).y}-12-31`;
}

export function addMonths(iso: string, months: number): string {
  const { y, m, d } = parseISODate(iso);
  const dt = new Date(y, m - 1 + months, d);
  return toISODate(dt);
}

export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  if (from > to) return days;
  let cursor = from;
  while (cursor <= to) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function formatPretty(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return fromISODate(iso).toLocaleDateString("en-US", opts ?? {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function formatShort(iso: string): string {
  return fromISODate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function isValidISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function periodRange(
  asOf: string,
  period: "week" | "month" | "year" | "all",
  startDate?: string,
): { from: string; to: string } {
  if (period === "week") return { from: startOfWeek(asOf), to: asOf };
  if (period === "month") return { from: startOfMonth(asOf), to: asOf };
  if (period === "year") return { from: startOfYear(asOf), to: asOf };
  return { from: startDate && startDate < asOf ? startDate : addDays(asOf, -365), to: asOf };
}
