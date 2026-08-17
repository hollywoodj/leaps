import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb, openDatabase, setDb } from "./db";
import {
  applyLog,
  createTracker,
  getReports,
  getToday,
  seedSampleData,
  toggleMilestone,
} from "./repo";

beforeEach(() => {
  setDb(openDatabase(":memory:"));
});

afterEach(() => {
  closeDb();
});

describe("repo", () => {
  it("creates a habit and logs it into Done", () => {
    const tracker = createTracker({
      title: "Meditate",
      type: "habit",
      emoji: "🧘",
      startDate: "2026-08-17",
    });
    const before = getToday("2026-08-17");
    expect(before.due).toHaveLength(1);
    applyLog(tracker.id, { date: "2026-08-17", status: "yes" });
    const after = getToday("2026-08-17");
    expect(after.due).toHaveLength(0);
    expect(after.done).toHaveLength(1);
    expect(after.perfect).toBe(true);
  });

  it("sums target logs and reports pace", () => {
    const tracker = createTracker({
      title: "Read 12 books",
      type: "target",
      unit: "books",
      goalValue: 12,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      repeatKind: "weekly",
      weekdays: [0],
    });
    applyLog(tracker.id, { date: "2026-08-02", status: "value", value: 4 });
    applyLog(tracker.id, { date: "2026-08-09", status: "value", value: 2 });
    const today = getToday("2026-08-16");
    const item = [...today.due, ...today.done].find((row) => row.tracker.id === tracker.id);
    expect(item?.progress.current).toBe(6);
    expect(item?.progress.goal).toBe(12);
  });

  it("toggles project milestones", () => {
    const tracker = createTracker({
      title: "Launch",
      type: "project",
      startDate: "2026-08-01",
      endDate: "2026-09-01",
      repeatKind: "weekly",
      weekdays: [6],
      milestones: [{ title: "MVP" }, { title: "Launch" }],
    });
    const first = getToday("2026-08-15").due[0] ?? getToday("2026-08-15").done[0];
    expect(first.milestones).toHaveLength(2);
    toggleMilestone(first.milestones[0].id, "2026-08-15");
    const detailDone = getToday("2026-08-15");
    const item = [...detailDone.due, ...detailDone.done][0];
    expect(item.progress.current).toBe(1);
  });

  it("seeds sample data into sqlite", () => {
    seedSampleData("2026-08-17");
    const today = getToday("2026-08-17");
    expect(today.due.length + today.done.length + today.missed.length).toBeGreaterThan(0);
    const reports = getReports("2026-08-17", "month");
    expect(reports.trackerCount).toBeGreaterThan(3);
    expect(reports.trends.length).toBeGreaterThan(0);
  });
});
