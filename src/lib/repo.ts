import { randomUUID } from "node:crypto";
import { TRACKER_COLORS } from "./colors";
import { addDays, eachDay, todayISO } from "./dates";
import { getDb } from "./db";
import { isScheduledOn, scheduledDays } from "./due";
import {
  classifyToday,
  cumulativeSeries,
  logsOnDate,
  progressSnapshot,
  sumValues,
} from "./stats";
import { TEMPLATES } from "./templates";
import type {
  LogEntry,
  LogStatus,
  Milestone,
  RepeatKind,
  ReportsPayload,
  Tag,
  TodayItem,
  Tracker,
  TrackerDetail,
  TrackerInput,
  TrackerType,
} from "./types";

type TrackerRow = {
  id: string;
  title: string;
  emoji: string;
  type: TrackerType;
  color: string;
  unit: string;
  goal_value: number;
  is_bad: number;
  start_date: string;
  end_date: string | null;
  repeat_kind: RepeatKind;
  repeat_interval: number;
  weekdays: string | null;
  times_per_period: number;
  sort_order: number;
  archived: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

type LogRow = {
  id: string;
  tracker_id: string;
  date: string;
  value: number;
  status: LogStatus;
  note: string | null;
  created_at: string;
};

type MilestoneRow = {
  id: string;
  tracker_id: string;
  title: string;
  sort_order: number;
  completed: number;
  completed_at: string | null;
  due_date: string | null;
};

type TagRow = { id: string; name: string; color: string };

function mapTracker(row: TrackerRow): Tracker {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    type: row.type,
    color: row.color,
    unit: row.unit,
    goalValue: row.goal_value,
    isBad: Boolean(row.is_bad),
    startDate: row.start_date,
    endDate: row.end_date,
    repeatKind: row.repeat_kind,
    repeatInterval: row.repeat_interval,
    weekdays: row.weekdays ? (JSON.parse(row.weekdays) as number[]) : null,
    timesPerPeriod: row.times_per_period,
    sortOrder: row.sort_order,
    archived: Boolean(row.archived),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLog(row: LogRow): LogEntry {
  return {
    id: row.id,
    trackerId: row.tracker_id,
    date: row.date,
    value: row.value,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    trackerId: row.tracker_id,
    title: row.title,
    sortOrder: row.sort_order,
    completed: Boolean(row.completed),
    completedAt: row.completed_at,
    dueDate: row.due_date,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listTrackers(includeArchived = false): Tracker[] {
  const db = getDb();
  const rows = includeArchived
    ? db.prepare("SELECT * FROM trackers ORDER BY sort_order ASC, created_at ASC").all()
    : db.prepare("SELECT * FROM trackers WHERE archived = 0 ORDER BY sort_order ASC, created_at ASC").all();
  return (rows as TrackerRow[]).map(mapTracker);
}

export function getTracker(id: string): Tracker | null {
  const row = getDb().prepare("SELECT * FROM trackers WHERE id = ?").get(id) as TrackerRow | undefined;
  return row ? mapTracker(row) : null;
}

export function listTags(): Tag[] {
  return (getDb().prepare("SELECT * FROM tags ORDER BY name COLLATE NOCASE").all() as TagRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
  }));
}

export function tagsForTracker(trackerId: string): Tag[] {
  const rows = getDb()
    .prepare(
      `SELECT t.* FROM tags t
       JOIN tracker_tags tt ON tt.tag_id = t.id
       WHERE tt.tracker_id = ?
       ORDER BY t.name COLLATE NOCASE`,
    )
    .all(trackerId) as TagRow[];
  return rows.map((row) => ({ id: row.id, name: row.name, color: row.color }));
}

export function logsForTracker(trackerId: string, from?: string, to?: string): LogEntry[] {
  const db = getDb();
  if (from && to) {
    return (db.prepare("SELECT * FROM logs WHERE tracker_id = ? AND date >= ? AND date <= ? ORDER BY date ASC, created_at ASC").all(trackerId, from, to) as LogRow[]).map(mapLog);
  }
  return (db.prepare("SELECT * FROM logs WHERE tracker_id = ? ORDER BY date ASC, created_at ASC").all(trackerId) as LogRow[]).map(mapLog);
}

export function milestonesForTracker(trackerId: string): Milestone[] {
  return (getDb().prepare("SELECT * FROM milestones WHERE tracker_id = ? ORDER BY sort_order ASC").all(trackerId) as MilestoneRow[]).map(mapMilestone);
}

function maxSortOrder(): number {
  const row = getDb().prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM trackers").get() as { m: number };
  return row.m;
}

export function createTag(name: string, color = "#0A84FF"): Tag {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required");
  const existing = getDb().prepare("SELECT * FROM tags WHERE name = ? COLLATE NOCASE").get(trimmed) as TagRow | undefined;
  if (existing) return { id: existing.id, name: existing.name, color: existing.color };
  const tag: Tag = { id: randomUUID(), name: trimmed, color };
  getDb().prepare("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)").run(tag.id, tag.name, tag.color);
  return tag;
}

export function deleteTag(id: string): void {
  getDb().prepare("DELETE FROM tags WHERE id = ?").run(id);
}

function setTrackerTags(trackerId: string, tagIds: string[]): void {
  const db = getDb();
  db.prepare("DELETE FROM tracker_tags WHERE tracker_id = ?").run(trackerId);
  const insert = db.prepare("INSERT INTO tracker_tags (tracker_id, tag_id) VALUES (?, ?)");
  for (const tagId of tagIds) insert.run(trackerId, tagId);
}

export function createTracker(input: TrackerInput): Tracker {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  const id = randomUUID();
  const created = nowIso();
  const startDate = input.startDate || todayISO();
  const db = getDb();
  db.prepare(
    `INSERT INTO trackers (
      id, title, emoji, type, color, unit, goal_value, is_bad, start_date, end_date,
      repeat_kind, repeat_interval, weekdays, times_per_period, sort_order, archived, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
  ).run(
    id,
    title,
    input.emoji || "🎯",
    input.type,
    input.color || "#0A84FF",
    input.unit || "",
    input.goalValue ?? 1,
    input.isBad ? 1 : 0,
    startDate,
    input.endDate ?? null,
    input.repeatKind || "daily",
    input.repeatInterval ?? 1,
    input.weekdays ? JSON.stringify(input.weekdays) : null,
    input.timesPerPeriod ?? 1,
    maxSortOrder() + 1,
    input.notes || "",
    created,
    created,
  );
  if (input.tagIds?.length) setTrackerTags(id, input.tagIds);
  if (input.milestones?.length) {
    const insert = db.prepare(
      "INSERT INTO milestones (id, tracker_id, title, sort_order, completed, completed_at, due_date) VALUES (?, ?, ?, ?, 0, NULL, ?)",
    );
    input.milestones.forEach((milestone, index) => {
      insert.run(randomUUID(), id, milestone.title, index, milestone.dueDate ?? null);
    });
  }
  return getTracker(id)!;
}

export function updateTracker(id: string, patch: Partial<TrackerInput> & { archived?: boolean }): Tracker {
  const current = getTracker(id);
  if (!current) throw new Error("Tracker not found");
  const next: Tracker = {
    ...current,
    title: patch.title?.trim() ?? current.title,
    emoji: patch.emoji ?? current.emoji,
    type: patch.type ?? current.type,
    color: patch.color ?? current.color,
    unit: patch.unit ?? current.unit,
    goalValue: patch.goalValue ?? current.goalValue,
    isBad: patch.isBad ?? current.isBad,
    startDate: patch.startDate ?? current.startDate,
    endDate: patch.endDate === undefined ? current.endDate : patch.endDate,
    repeatKind: patch.repeatKind ?? current.repeatKind,
    repeatInterval: patch.repeatInterval ?? current.repeatInterval,
    weekdays: patch.weekdays === undefined ? current.weekdays : patch.weekdays,
    timesPerPeriod: patch.timesPerPeriod ?? current.timesPerPeriod,
    notes: patch.notes ?? current.notes,
    archived: patch.archived ?? current.archived,
    updatedAt: nowIso(),
  };
  getDb()
    .prepare(
      `UPDATE trackers SET
        title=?, emoji=?, type=?, color=?, unit=?, goal_value=?, is_bad=?, start_date=?, end_date=?,
        repeat_kind=?, repeat_interval=?, weekdays=?, times_per_period=?, archived=?, notes=?, updated_at=?
       WHERE id=?`,
    )
    .run(
      next.title,
      next.emoji,
      next.type,
      next.color,
      next.unit,
      next.goalValue,
      next.isBad ? 1 : 0,
      next.startDate,
      next.endDate,
      next.repeatKind,
      next.repeatInterval,
      next.weekdays ? JSON.stringify(next.weekdays) : null,
      next.timesPerPeriod,
      next.archived ? 1 : 0,
      next.notes,
      next.updatedAt,
      id,
    );
  if (patch.tagIds) setTrackerTags(id, patch.tagIds);
  if (patch.milestones) {
    const db = getDb();
    db.prepare("DELETE FROM milestones WHERE tracker_id = ?").run(id);
    const insert = db.prepare(
      "INSERT INTO milestones (id, tracker_id, title, sort_order, completed, completed_at, due_date) VALUES (?, ?, ?, ?, 0, NULL, ?)",
    );
    patch.milestones.forEach((milestone, index) => {
      insert.run(randomUUID(), id, milestone.title, index, milestone.dueDate ?? null);
    });
  }
  return getTracker(id)!;
}

export function deleteTracker(id: string): void {
  getDb().prepare("DELETE FROM trackers WHERE id = ?").run(id);
}

export function reorderTrackers(ids: string[]): void {
  const update = getDb().prepare("UPDATE trackers SET sort_order = ? WHERE id = ?");
  const tx = getDb().transaction((list: string[]) => {
    list.forEach((id, index) => update.run(index, id));
  });
  tx(ids);
}

export function startOver(id: string): Tracker {
  const db = getDb();
  db.prepare("DELETE FROM logs WHERE tracker_id = ?").run(id);
  db.prepare("UPDATE milestones SET completed = 0, completed_at = NULL WHERE tracker_id = ?").run(id);
  return updateTracker(id, { startDate: todayISO() });
}

export type LogInput = {
  date: string;
  status: LogStatus;
  value?: number;
  note?: string | null;
};

export function applyLog(trackerId: string, input: LogInput): LogEntry {
  const tracker = getTracker(trackerId);
  if (!tracker) throw new Error("Tracker not found");
  const db = getDb();
  const date = input.date;
  const existing = logsOnDate(logsForTracker(trackerId, date, date), date);

  if (input.status === "skip") {
    db.prepare("DELETE FROM logs WHERE tracker_id = ? AND date = ?").run(trackerId, date);
    const log: LogEntry = {
      id: randomUUID(),
      trackerId,
      date,
      value: 0,
      status: "skip",
      note: input.note ?? null,
      createdAt: nowIso(),
    };
    db.prepare("INSERT INTO logs (id, tracker_id, date, value, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      log.id, log.trackerId, log.date, log.value, log.status, log.note, log.createdAt,
    );
    return log;
  }

  if (tracker.type === "habit") {
    const current = existing.find((l) => l.status !== "skip");
    if (input.status === "yes") {
      const increment = input.value ?? 1;
      if (current && (tracker.timesPerPeriod > 1 || tracker.isBad)) {
        const nextValue = current.value + increment;
        db.prepare("UPDATE logs SET value = ?, status = ?, note = COALESCE(?, note) WHERE id = ?").run(
          nextValue,
          "yes",
          input.note ?? null,
          current.id,
        );
        return { ...current, value: nextValue, status: "yes", note: input.note ?? current.note };
      }
      if (current && tracker.timesPerPeriod <= 1 && !tracker.isBad) {
        db.prepare("DELETE FROM logs WHERE id = ?").run(current.id);
        return current;
      }
    }
    if (current) db.prepare("DELETE FROM logs WHERE tracker_id = ? AND date = ?").run(trackerId, date);
    const log: LogEntry = {
      id: randomUUID(),
      trackerId,
      date,
      value: input.status === "no" ? 0 : (input.value ?? 1),
      status: input.status,
      note: input.note ?? null,
      createdAt: nowIso(),
    };
    db.prepare("INSERT INTO logs (id, tracker_id, date, value, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      log.id, log.trackerId, log.date, log.value, log.status, log.note, log.createdAt,
    );
    return log;
  }

  if (tracker.type === "average") {
    db.prepare("DELETE FROM logs WHERE tracker_id = ? AND date = ?").run(trackerId, date);
    const log: LogEntry = {
      id: randomUUID(),
      trackerId,
      date,
      value: input.value ?? 0,
      status: "value",
      note: input.note ?? null,
      createdAt: nowIso(),
    };
    db.prepare("INSERT INTO logs (id, tracker_id, date, value, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      log.id, log.trackerId, log.date, log.value, log.status, log.note, log.createdAt,
    );
    return log;
  }

  const log: LogEntry = {
    id: randomUUID(),
    trackerId,
    date,
    value: input.value ?? 1,
    status: "value",
    note: input.note ?? null,
    createdAt: nowIso(),
  };
  db.prepare("INSERT INTO logs (id, tracker_id, date, value, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    log.id, log.trackerId, log.date, log.value, log.status, log.note, log.createdAt,
  );
  return log;
}

export function updateLog(id: string, patch: { value?: number; note?: string | null; status?: LogStatus; date?: string }): LogEntry {
  const row = getDb().prepare("SELECT * FROM logs WHERE id = ?").get(id) as LogRow | undefined;
  if (!row) throw new Error("Log not found");
  const next = {
    ...mapLog(row),
    value: patch.value ?? row.value,
    note: patch.note === undefined ? row.note : patch.note,
    status: patch.status ?? row.status,
    date: patch.date ?? row.date,
  };
  getDb().prepare("UPDATE logs SET value = ?, note = ?, status = ?, date = ? WHERE id = ?").run(
    next.value, next.note, next.status, next.date, id,
  );
  return next;
}

export function deleteLog(id: string): void {
  getDb().prepare("DELETE FROM logs WHERE id = ?").run(id);
}

export function undoDay(trackerId: string, date: string): void {
  getDb().prepare("DELETE FROM logs WHERE tracker_id = ? AND date = ?").run(trackerId, date);
}

export function toggleMilestone(id: string, date: string): Milestone {
  const row = getDb().prepare("SELECT * FROM milestones WHERE id = ?").get(id) as MilestoneRow | undefined;
  if (!row) throw new Error("Milestone not found");
  const completed = row.completed ? 0 : 1;
  const completedAt = completed ? date : null;
  getDb().prepare("UPDATE milestones SET completed = ?, completed_at = ? WHERE id = ?").run(completed, completedAt, id);
  if (completed) {
    applyLog(row.tracker_id, { date, status: "value", value: 1, note: row.title });
  }
  return mapMilestone({ ...row, completed, completed_at: completedAt });
}

export function getToday(date: string): { date: string; due: TodayItem[]; done: TodayItem[]; missed: TodayItem[]; perfect: boolean } {
  const trackers = listTrackers(false);
  const due: TodayItem[] = [];
  const done: TodayItem[] = [];
  const missed: TodayItem[] = [];

  for (const tracker of trackers) {
    const logs = logsForTracker(tracker.id);
    const milestones = tracker.type === "project" ? milestonesForTracker(tracker.id) : [];
    const section = classifyToday(tracker, logs, date, milestones);
    if (section === "hidden") continue;
    const item: TodayItem = {
      tracker,
      tags: tagsForTracker(tracker.id),
      section,
      progress: progressSnapshot(tracker, logs, date, milestones),
      todayLogs: logsOnDate(logs, date),
      todayValue: sumValues(logsOnDate(logs, date)),
      milestones,
    };
    if (section === "due") due.push(item);
    else if (section === "missed") missed.push(item);
    else done.push(item);
  }

  return {
    date,
    due,
    done,
    missed,
    perfect: due.length === 0 && missed.length === 0 && done.length > 0,
  };
}

export function getTrackerDetail(id: string, asOf = todayISO()): TrackerDetail {
  const tracker = getTracker(id);
  if (!tracker) throw new Error("Tracker not found");
  const logs = logsForTracker(id);
  const milestones = milestonesForTracker(id);
  const from = tracker.startDate < addDays(asOf, -120) ? addDays(asOf, -120) : tracker.startDate;
  const calendar = eachDay(from, asOf).map((date) => {
    const dayLogs = logsOnDate(logs, date);
    return {
      date,
      value: sumValues(dayLogs),
      status: dayLogs.at(-1)?.status ?? null,
    };
  });
  return {
    tracker,
    tags: tagsForTracker(id),
    milestones,
    logs: logs.slice().reverse(),
    progress: progressSnapshot(tracker, logs, asOf, milestones),
    calendar,
    series: cumulativeSeries(tracker, logs, from, asOf),
  };
}

export function getReports(asOf: string, period: "week" | "month" | "year" | "all", tagId?: string | null): ReportsPayload {
  const all = listTrackers(false);
  const tagged = tagId
    ? all.filter((tracker) => tagsForTracker(tracker.id).some((tag) => tag.id === tagId))
    : all;
  const oldest = tagged.reduce((min, t) => (t.startDate < min ? t.startDate : min), asOf);
  const from = period === "week" ? addDays(asOf, -6)
    : period === "month" ? addDays(asOf, -29)
    : period === "year" ? addDays(asOf, -364)
    : oldest;
  const cache = tagged.map((tracker) => ({
    tracker,
    tags: tagsForTracker(tracker.id),
    logs: logsForTracker(tracker.id),
    milestones: tracker.type === "project" ? milestonesForTracker(tracker.id) : [],
  }));
  const trackers = cache.map(({ tracker, tags, logs, milestones }) => {
    const days = scheduledDays(tracker, from, asOf);
    const completed = days.filter((date) => classifyToday(tracker, logs, date, milestones) === "done").length;
    return {
      tracker,
      tags,
      progress: progressSnapshot(tracker, logs, asOf, milestones),
      completed,
      dueCount: days.length,
    };
  });

  const overallPercent = trackers.length
    ? trackers.reduce((s, t) => s + Math.min(100, Math.max(0, t.progress.percent)), 0) / trackers.length
    : 0;

  const dayList = eachDay(from, asOf);
  const calendar = dayList.map((date) => {
    let due = 0;
    let done = 0;
    for (const { tracker, logs, milestones } of cache) {
      if (!isScheduledOn(tracker, date)) continue;
      due += 1;
      if (classifyToday(tracker, logs, date, milestones) === "done") done += 1;
    }
    return { date, percent: due ? (done / due) * 100 : 0, due, done };
  });

  const bucketSize = period === "year" || period === "all" ? 7 : 1;
  const trends: { date: string; percent: number }[] = [];
  for (let i = 0; i < calendar.length; i += bucketSize) {
    const slice = calendar.slice(i, i + bucketSize);
    const due = slice.reduce((s, d) => s + d.due, 0);
    const done = slice.reduce((s, d) => s + d.done, 0);
    trends.push({ date: slice[0].date, percent: due ? (done / due) * 100 : 0 });
  }

  const perfectDays = calendar.filter((d) => d.due > 0 && d.done === d.due).length;

  return {
    period,
    from,
    to: asOf,
    overallPercent,
    onTrackCount: trackers.filter((t) => t.progress.onTrack).length,
    trackerCount: trackers.length,
    perfectDays,
    dayCount: calendar.filter((d) => d.due > 0).length,
    trackers,
    trends,
    calendar,
  };
}

export function exportData() {
  return {
    exportedAt: nowIso(),
    trackers: listTrackers(true).map((tracker) => ({
      ...tracker,
      tags: tagsForTracker(tracker.id),
      logs: logsForTracker(tracker.id),
      milestones: milestonesForTracker(tracker.id),
    })),
    tags: listTags(),
  };
}

export function seedSampleData(asOf = todayISO()): void {
  if (listTrackers(true).length) return;
  const health = createTag("Health", "#34C759");
  const growth = createTag("Growth", "#5856D6");
  const money = createTag("Money", "#FF9500");

  const picks = ["meditate", "drink-water", "read", "exercise", "save", "no-sugar", "side-project"];
  for (const id of picks) {
    const template = TEMPLATES.find((t) => t.id === id)!;
    const start = addDays(asOf, -45);
    const tracker = createTracker({
      title: template.title,
      emoji: template.emoji,
      type: template.type,
      color: template.color,
      unit: template.unit,
      goalValue: template.goalValue,
      isBad: template.isBad,
      startDate: start,
      endDate: template.endInDays ? addDays(start, template.endInDays) : null,
      repeatKind: template.repeatKind,
      repeatInterval: template.repeatInterval,
      weekdays: template.weekdays,
      timesPerPeriod: template.timesPerPeriod,
      notes: template.notes,
      tagIds: template.category === "Money" ? [money.id] : template.category === "Learning" || template.category === "Productivity" ? [growth.id] : [health.id],
      milestones: template.milestones?.map((title) => ({ title })),
    });

    const days = scheduledDays(tracker, start, asOf);
    days.forEach((date, index) => {
      if (date === asOf) return;
      const roll = (index * 17 + date.length) % 10;
      if (tracker.type === "habit") {
        if (tracker.isBad) {
          if (roll < 7) applyLog(tracker.id, { date, status: "no" });
          else if (roll === 7) applyLog(tracker.id, { date, status: "yes", value: 1 });
        } else if (roll < 8) {
          applyLog(tracker.id, { date, status: "yes", value: tracker.timesPerPeriod > 1 && tracker.repeatKind === "daily" ? Math.min(tracker.timesPerPeriod, 4 + (roll % 5)) : 1 });
        } else if (roll === 8) {
          applyLog(tracker.id, { date, status: "no" });
        }
      } else if (tracker.type === "target") {
        if (roll < 7) applyLog(tracker.id, { date, status: "value", value: tracker.unit === "$" ? 20 + roll * 8 : tracker.unit === "books" ? 0.2 : 1 + (roll % 3) });
      } else if (tracker.type === "average") {
        if (roll < 8) applyLog(tracker.id, { date, status: "value", value: 6.5 + (roll % 4) * 0.4 });
      }
    });

    if (tracker.type === "project") {
      const milestones = milestonesForTracker(tracker.id);
      if (milestones[0]) toggleMilestone(milestones[0].id, addDays(asOf, -20));
      if (milestones[1]) toggleMilestone(milestones[1].id, addDays(asOf, -8));
    }
  }
}

export { TRACKER_COLORS };
