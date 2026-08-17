import { describe, expect, it } from "vitest";
import { addDays, daysBetween, startOfWeek, weekday } from "./dates";
import { isScheduledOn, periodBounds, scheduledDays } from "./due";
import {
  classifyToday,
  currentStreak,
  progressSnapshot,
  successRate,
  targetTotals,
} from "./stats";
import type { LogEntry, Tracker } from "./types";

function tracker(overrides: Partial<Tracker> = {}): Tracker {
  return {
    id: "t1",
    title: "Meditate",
    emoji: "🧘",
    type: "habit",
    color: "#5856D6",
    unit: "",
    goalValue: 1,
    isBad: false,
    startDate: "2026-07-01",
    endDate: null,
    repeatKind: "daily",
    repeatInterval: 1,
    weekdays: null,
    timesPerPeriod: 1,
    sortOrder: 0,
    archived: false,
    notes: "",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

function log(date: string, status: LogEntry["status"], value = 1): LogEntry {
  return {
    id: date + status,
    trackerId: "t1",
    date,
    value,
    status,
    note: null,
    createdAt: date,
  };
}

describe("dates", () => {
  it("computes days between inclusive distance", () => {
    expect(daysBetween("2026-08-01", "2026-08-04")).toBe(3);
  });

  it("starts the week on Monday", () => {
    expect(startOfWeek("2026-08-17")).toBe("2026-08-17");
    expect(weekday("2026-08-17")).toBe(1);
  });
});

describe("due", () => {
  it("schedules daily interval habits", () => {
    const t = tracker({ repeatKind: "daily", repeatInterval: 2, startDate: "2026-08-01" });
    expect(isScheduledOn(t, "2026-08-01")).toBe(true);
    expect(isScheduledOn(t, "2026-08-02")).toBe(false);
    expect(isScheduledOn(t, "2026-08-03")).toBe(true);
  });

  it("schedules selected weekdays", () => {
    const t = tracker({ repeatKind: "weekly", weekdays: [1, 3, 5], startDate: "2026-08-01" });
    expect(isScheduledOn(t, "2026-08-17")).toBe(true);
    expect(isScheduledOn(t, "2026-08-18")).toBe(false);
    expect(isScheduledOn(t, "2026-08-19")).toBe(true);
  });

  it("does not schedule before start or after end", () => {
    const t = tracker({ startDate: "2026-08-10", endDate: "2026-08-12" });
    expect(isScheduledOn(t, "2026-08-09")).toBe(false);
    expect(isScheduledOn(t, "2026-08-12")).toBe(true);
    expect(isScheduledOn(t, "2026-08-13")).toBe(false);
  });
});

describe("habit classification", () => {
  it("marks a daily habit done after yes", () => {
    const t = tracker();
    expect(classifyToday(t, [log("2026-08-17", "yes")], "2026-08-17")).toBe("done");
    expect(classifyToday(t, [], "2026-08-17")).toBe("due");
    expect(classifyToday(t, [log("2026-08-17", "no")], "2026-08-17")).toBe("missed");
    expect(classifyToday(t, [log("2026-08-17", "skip")], "2026-08-17")).toBe("done");
  });

  it("hides weekly 3x habits after the period goal is met", () => {
    const t = tracker({
      repeatKind: "weekly",
      timesPerPeriod: 3,
      weekdays: null,
      startDate: "2026-08-17",
    });
    const logs = [
      log("2026-08-17", "yes"),
      log("2026-08-18", "yes"),
      log("2026-08-19", "yes"),
    ];
    expect(classifyToday(t, logs, "2026-08-20")).toBe("hidden");
    expect(classifyToday(t, logs, "2026-08-19")).toBe("done");
  });

  it("treats resisted bad habits as done and over-limit as missed", () => {
    const t = tracker({ isBad: true, goalValue: 0 });
    expect(classifyToday(t, [log("2026-08-17", "no", 0)], "2026-08-17")).toBe("done");
    expect(classifyToday(t, [log("2026-08-17", "yes")], "2026-08-17")).toBe("missed");
  });
});

describe("streaks and pace", () => {
  it("counts consecutive successful due days and ignores skips", () => {
    const t = tracker({ startDate: "2026-08-10" });
    const logs = [
      log("2026-08-10", "yes"),
      log("2026-08-11", "yes"),
      log("2026-08-12", "skip"),
      log("2026-08-13", "yes"),
    ];
    expect(currentStreak(t, logs, "2026-08-14")).toBe(3);
  });

  it("breaks a streak on a miss", () => {
    const t = tracker({ startDate: "2026-08-10" });
    const logs = [log("2026-08-10", "yes"), log("2026-08-11", "no"), log("2026-08-12", "yes")];
    expect(currentStreak(t, logs, "2026-08-12")).toBe(1);
  });

  it("computes target pace as green when ahead", () => {
    const t = tracker({
      type: "target",
      goalValue: 100,
      startDate: "2026-08-01",
      endDate: "2026-08-20",
    });
    const logs = [log("2026-08-01", "value", 40), log("2026-08-05", "value", 30)];
    const totals = targetTotals(t, logs, "2026-08-10");
    expect(totals.actual).toBe(70);
    expect(totals.onTrack).toBe(true);
    expect(progressSnapshot(t, logs, "2026-08-10").onTrack).toBe(true);
  });

  it("computes success rate from scheduled days", () => {
    const t = tracker({ startDate: "2026-08-01" });
    const logs = [log("2026-08-01", "yes"), log("2026-08-02", "no"), log("2026-08-03", "yes")];
    expect(successRate(t, logs, "2026-08-01", "2026-08-03")).toBeCloseTo(2 / 3);
  });
});

describe("period bounds", () => {
  it("returns the containing week and month", () => {
    expect(periodBounds("2026-08-17", "weekly")).toEqual({
      start: "2026-08-17",
      end: "2026-08-23",
    });
    expect(periodBounds("2026-08-17", "monthly").start).toBe("2026-08-01");
    expect(scheduledDays(tracker({ startDate: "2026-08-17", weekdays: [1] }), "2026-08-17", "2026-08-24")).toContain("2026-08-17");
  });
});

describe("addDays", () => {
  it("crosses month boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
  });
});
