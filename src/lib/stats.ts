import { addDays, daysBetween, eachDay, periodRange } from "./dates";
import { isScheduledOn, periodBounds, scheduledDays } from "./due";
import type {
  LogEntry,
  LogStatus,
  Milestone,
  ProgressSnapshot,
  RepeatKind,
  Tracker,
} from "./types";

export function logsOnDate(logs: LogEntry[], date: string): LogEntry[] {
  return logs.filter((log) => log.date === date);
}

export function logsInRange(logs: LogEntry[], from: string, to: string): LogEntry[] {
  return logs.filter((log) => log.date >= from && log.date <= to);
}

export function sumValues(logs: LogEntry[]): number {
  return logs.reduce((sum, log) => {
    if (log.status === "skip") return sum;
    return sum + log.value;
  }, 0);
}

export function hasSkip(logs: LogEntry[]): boolean {
  return logs.some((log) => log.status === "skip");
}

export function isSuccessLogs(tracker: Tracker, logs: LogEntry[]): boolean {
  if (!logs.length || hasSkip(logs)) return false;
  if (tracker.type === "habit") {
    const value = sumValues(logs);
    if (tracker.isBad) {
      const fails = logs.filter((log) => log.status === "yes").reduce((s, l) => s + l.value, 0);
      return fails <= tracker.goalValue && logs.some((l) => l.status === "no" || l.status === "yes");
    }
    const needed = tracker.repeatKind === "daily" ? tracker.timesPerPeriod : 1;
    return value >= needed && logs.some((l) => l.status === "yes" || l.status === "value");
  }
  if (tracker.type === "average") {
    const numeric = logs.filter((l) => l.status !== "skip");
    if (!numeric.length) return false;
    const avg = sumValues(numeric) / numeric.length;
    return tracker.isBad ? avg <= tracker.goalValue : avg >= tracker.goalValue;
  }
  return sumValues(logs) > 0;
}

export function isFailLogs(tracker: Tracker, logs: LogEntry[]): boolean {
  if (!logs.length || hasSkip(logs)) return false;
  if (tracker.type === "habit") {
    if (tracker.isBad) {
      const fails = logs.filter((log) => log.status === "yes").reduce((s, l) => s + l.value, 0);
      return fails > tracker.goalValue;
    }
    return logs.some((l) => l.status === "no") && !isSuccessLogs(tracker, logs);
  }
  return false;
}

export function periodCompletions(tracker: Tracker, logs: LogEntry[], date: string): number {
  const bounds = periodBounds(date, tracker.repeatKind);
  const inPeriod = logsInRange(logs, bounds.start, bounds.end);
  if (tracker.type === "habit") {
    if (tracker.isBad) {
      return inPeriod.filter((l) => l.status === "yes").reduce((s, l) => s + l.value, 0);
    }
    const byDay = new Map<string, LogEntry[]>();
    for (const log of inPeriod) {
      const list = byDay.get(log.date) ?? [];
      list.push(log);
      byDay.set(log.date, list);
    }
    if (tracker.repeatKind === "daily") {
      return sumValues(inPeriod.filter((l) => l.status === "yes" || l.status === "value"));
    }
    let count = 0;
    for (const [, dayLogs] of byDay) {
      if (isSuccessLogs(tracker, dayLogs)) count += 1;
    }
    return count;
  }
  return sumValues(inPeriod);
}

export function needsMoreInPeriod(tracker: Tracker, logs: LogEntry[], date: string): boolean {
  if (tracker.type === "target") {
    const total = sumValues(logs.filter((l) => l.date <= date));
    return total < tracker.goalValue;
  }
  if (tracker.type === "project") return true;
  if (tracker.type === "average") {
    return logsOnDate(logs, date).filter((l) => l.status !== "skip").length === 0;
  }
  const current = periodCompletions(tracker, logs, date);
  if (tracker.isBad) return true;
  return current < tracker.timesPerPeriod;
}

export function classifyToday(
  tracker: Tracker,
  logs: LogEntry[],
  date: string,
  milestones: Milestone[] = [],
): "due" | "done" | "missed" | "hidden" {
  if (!isScheduledOn(tracker, date)) return "hidden";
  const todayLogs = logsOnDate(logs, date);
  if (hasSkip(todayLogs)) return "done";

  if (tracker.type === "project") {
    const remaining = milestones.filter((m) => !m.completed);
    if (!remaining.length) return "done";
    if (todayLogs.some((l) => l.status === "value" && l.value > 0) || milestones.some((m) => m.completedAt === date)) {
      return remaining.length ? "due" : "done";
    }
    return "due";
  }

  if (tracker.type === "habit") {
    if (isFailLogs(tracker, todayLogs)) return "missed";
    if (tracker.isBad) {
      if (todayLogs.some((l) => l.status === "no")) return "done";
      return "due";
    }
    if (!needsMoreInPeriod(tracker, logs, date)) {
      return todayLogs.length ? "done" : "hidden";
    }
    if (isSuccessLogs(tracker, todayLogs) && tracker.repeatKind !== "daily") return "done";
    if (sumValues(todayLogs) >= tracker.timesPerPeriod && tracker.repeatKind === "daily") return "done";
    return "due";
  }

  if (tracker.type === "average") {
    if (todayLogs.some((l) => l.status === "value" || l.status === "yes")) return "done";
    return "due";
  }

  if (todayLogs.some((l) => l.status === "value" || l.status === "yes")) return "done";
  return "due";
}

export function currentStreak(tracker: Tracker, logs: LogEntry[], asOf: string): number {
  const byDate = groupLogs(logs);
  let date = asOf;
  const todayLogs = byDate.get(asOf) ?? [];
  if (!hasOutcome(todayLogs) && !isFailLogs(tracker, todayLogs)) {
    date = addDays(asOf, -1);
  }
  let streak = 0;
  while (date >= tracker.startDate) {
    if (!isScheduledOn(tracker, date)) {
      date = addDays(date, -1);
      continue;
    }
    const dayLogs = byDate.get(date) ?? [];
    if (hasSkip(dayLogs)) {
      date = addDays(date, -1);
      continue;
    }
    if (isSuccessLogs(tracker, dayLogs) || (tracker.type === "target" && sumValues(dayLogs) > 0) || (tracker.type === "project" && sumValues(dayLogs) > 0)) {
      streak += 1;
      date = addDays(date, -1);
      continue;
    }
    break;
  }
  return streak;
}

export function bestStreak(tracker: Tracker, logs: LogEntry[], asOf: string): number {
  const days = scheduledDays(tracker, tracker.startDate, asOf);
  const byDate = groupLogs(logs);
  let best = 0;
  let current = 0;
  for (const date of days) {
    const dayLogs = byDate.get(date) ?? [];
    if (hasSkip(dayLogs)) continue;
    if (isSuccessLogs(tracker, dayLogs) || ((tracker.type === "target" || tracker.type === "project") && sumValues(dayLogs) > 0)) {
      current += 1;
      if (current > best) best = current;
    } else if (date < asOf || hasOutcome(dayLogs)) {
      current = 0;
    }
  }
  return Math.max(best, currentStreak(tracker, logs, asOf));
}

export function successRate(tracker: Tracker, logs: LogEntry[], from: string, to: string): number {
  const days = scheduledDays(tracker, from, to);
  if (!days.length) return 0;
  const byDate = groupLogs(logs);
  let scored = 0;
  let success = 0;
  for (const date of days) {
    const dayLogs = byDate.get(date) ?? [];
    if (hasSkip(dayLogs)) continue;
    if (date > to) continue;
    const answered = hasOutcome(dayLogs);
    if (!answered && date >= to) continue;
    scored += 1;
    if (isSuccessLogs(tracker, dayLogs) || ((tracker.type === "target" || tracker.type === "project") && sumValues(dayLogs) > 0)) {
      success += 1;
    }
  }
  return scored === 0 ? 0 : success / scored;
}

export function targetTotals(tracker: Tracker, logs: LogEntry[], asOf: string) {
  const actual = sumValues(logs.filter((l) => l.date >= tracker.startDate && l.date <= asOf));
  const end = tracker.endDate ?? addDays(tracker.startDate, 89);
  const totalDays = Math.max(1, daysBetween(tracker.startDate, end) + 1);
  const elapsed = Math.min(totalDays, Math.max(0, daysBetween(tracker.startDate, asOf) + 1));
  const pace = (elapsed / totalDays) * tracker.goalValue;
  const percent = tracker.goalValue === 0 ? 100 : (actual / tracker.goalValue) * 100;
  const pacePercent = tracker.goalValue === 0 ? 100 : (pace / tracker.goalValue) * 100;
  return {
    actual,
    pace,
    percent,
    pacePercent,
    onTrack: actual + 1e-9 >= pace,
    end,
  };
}

export function averageCurrent(tracker: Tracker, logs: LogEntry[], asOf: string): number {
  const bounds = periodBounds(asOf, tracker.repeatKind);
  const windowLogs = logsInRange(logs, bounds.start, bounds.end).filter((l) => l.status !== "skip");
  if (!windowLogs.length) return 0;
  if (tracker.repeatKind === "daily") {
    const lastN = eachDay(addDays(asOf, -6), asOf);
    const present = lastN
      .map((date) => ({ date, logs: logsOnDate(logs, date).filter((l) => l.status !== "skip") }))
      .filter((x) => x.logs.length);
    if (!present.length) return 0;
    return present.reduce((s, x) => s + sumValues(x.logs), 0) / present.length;
  }
  const byDay = new Map<string, number>();
  for (const log of windowLogs) {
    byDay.set(log.date, (byDay.get(log.date) ?? 0) + log.value);
  }
  if (!byDay.size) return 0;
  return [...byDay.values()].reduce((a, b) => a + b, 0) / byDay.size;
}

export function projectPercent(milestones: Milestone[]): { current: number; goal: number; percent: number } {
  const goal = Math.max(1, milestones.length);
  const current = milestones.filter((m) => m.completed).length;
  return { current, goal, percent: (current / goal) * 100 };
}

export function progressSnapshot(
  tracker: Tracker,
  logs: LogEntry[],
  asOf: string,
  milestones: Milestone[] = [],
): ProgressSnapshot {
  const streak = currentStreak(tracker, logs, asOf);
  const best = bestStreak(tracker, logs, asOf);
  const from = tracker.startDate;
  const rate = successRate(tracker, logs, from, asOf);
  const unit = tracker.unit;

  if (tracker.type === "target") {
    const t = targetTotals(tracker, logs, asOf);
    return {
      label: `${formatAmount(t.actual, unit)} of ${formatAmount(tracker.goalValue, unit)}`,
      percent: t.percent,
      pacePercent: t.pacePercent,
      onTrack: t.onTrack,
      streak,
      bestStreak: best,
      successRate: rate,
      current: t.actual,
      goal: tracker.goalValue,
      unit,
    };
  }

  if (tracker.type === "average") {
    const current = averageCurrent(tracker, logs, asOf);
    const onTrack = tracker.isBad ? current <= tracker.goalValue : current >= tracker.goalValue;
    const percent = tracker.goalValue === 0 ? (current === 0 ? 100 : 0) : (current / tracker.goalValue) * 100;
    return {
      label: `${formatAmount(current, unit)} avg · goal ${formatAmount(tracker.goalValue, unit)}`,
      percent,
      pacePercent: 100,
      onTrack: current === 0 ? true : onTrack,
      streak,
      bestStreak: best,
      successRate: rate,
      current,
      goal: tracker.goalValue,
      unit,
    };
  }

  if (tracker.type === "project") {
    const p = projectPercent(milestones);
    const t = tracker.endDate
      ? targetTotals({ ...tracker, type: "target", goalValue: p.goal }, milestones.filter((m) => m.completed).map((m) => ({
          id: m.id,
          trackerId: tracker.id,
          date: m.completedAt ?? asOf,
          value: 1,
          status: "value" as LogStatus,
          note: null,
          createdAt: m.completedAt ?? asOf,
        })), asOf)
      : { pacePercent: p.percent, onTrack: true };
    return {
      label: `${p.current} of ${milestones.length || p.goal} milestones`,
      percent: p.percent,
      pacePercent: t.pacePercent,
      onTrack: t.onTrack,
      streak,
      bestStreak: best,
      successRate: rate,
      current: p.current,
      goal: milestones.length || p.goal,
      unit: "milestones",
    };
  }

  const current = periodCompletions(tracker, logs, asOf);
  if (tracker.isBad) {
    const limit = tracker.goalValue;
    const remaining = Math.max(0, limit - current);
    const percent = limit === 0 ? (current === 0 ? 100 : 0) : (remaining / limit) * 100;
    const onTrack = current <= limit;
    return {
      label: limit === 0
        ? current === 0 ? "Clean so far" : `${formatNumber(current)} over`
        : `${formatAmount(current, unit)} of ${formatAmount(limit, unit)} max`,
      percent: onTrack ? percent : 100,
      pacePercent: 100,
      onTrack,
      streak,
      bestStreak: best,
      successRate: rate,
      current,
      goal: limit,
      unit,
    };
  }

  const bounds = periodBounds(asOf, tracker.repeatKind);
  const goal = tracker.timesPerPeriod;
  const periodLabel = periodWord(tracker.repeatKind);
  return {
    label: `${formatAmount(current, unit)} of ${formatAmount(goal, unit)} ${periodLabel}`,
    percent: goal === 0 ? 100 : (current / goal) * 100,
    pacePercent: paceForHabit(tracker, asOf, bounds.start, bounds.end),
    onTrack: tracker.repeatKind === "daily" ? true : current + 1e-9 >= expectedHabitPace(tracker, asOf),
    streak,
    bestStreak: best,
    successRate: rate,
    current,
    goal,
    unit,
  };
}

export function cumulativeSeries(
  tracker: Tracker,
  logs: LogEntry[],
  from: string,
  to: string,
): { date: string; actual: number; pace: number | null }[] {
  const days = eachDay(from, to);
  let running = 0;
  const byDate = new Map<string, number>();
  for (const log of logs) {
    if (log.status === "skip") continue;
    byDate.set(log.date, (byDate.get(log.date) ?? 0) + log.value);
  }
  const end = tracker.endDate ?? to;
  const totalDays = Math.max(1, daysBetween(tracker.startDate, end) + 1);
  return days.map((date) => {
    running += byDate.get(date) ?? 0;
    let pace: number | null = null;
    if (tracker.type === "target" && date >= tracker.startDate) {
      const elapsed = Math.min(totalDays, Math.max(0, daysBetween(tracker.startDate, date) + 1));
      pace = (elapsed / totalDays) * tracker.goalValue;
    }
    return { date, actual: running, pace };
  });
}

export function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("en-US");
  return Number(value.toFixed(2)).toLocaleString("en-US");
}

export function formatAmount(value: number, unit: string): string {
  if (unit === "$" || unit === "£" || unit === "€") return `${unit}${formatNumber(value)}`;
  return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
}

function groupLogs(logs: LogEntry[]): Map<string, LogEntry[]> {
  const map = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const list = map.get(log.date) ?? [];
    list.push(log);
    map.set(log.date, list);
  }
  return map;
}

function hasOutcome(logs: LogEntry[]): boolean {
  return logs.some((l) => l.status !== "skip");
}

function periodWord(kind: RepeatKind): string {
  if (kind === "daily") return "today";
  if (kind === "weekly") return "this week";
  return "this month";
}

function expectedHabitPace(tracker: Tracker, asOf: string): number {
  const bounds = periodBounds(asOf, tracker.repeatKind);
  const scheduled = scheduledDays(tracker, bounds.start, bounds.end);
  if (!scheduled.length) return tracker.timesPerPeriod;
  const elapsed = scheduled.filter((d) => d <= asOf).length;
  return (elapsed / scheduled.length) * tracker.timesPerPeriod;
}

function paceForHabit(tracker: Tracker, asOf: string, start: string, end: string): number {
  const scheduled = scheduledDays(tracker, start, end);
  if (!scheduled.length) return 100;
  const elapsed = scheduled.filter((d) => d <= asOf).length;
  return (elapsed / scheduled.length) * 100;
}

export function reportPeriodRange(
  asOf: string,
  period: "week" | "month" | "year" | "all",
  oldestStart?: string,
) {
  return periodRange(asOf, period, oldestStart);
}
