export type TrackerType = "habit" | "target" | "average" | "project";
export type RepeatKind = "daily" | "weekly" | "monthly";
export type LogStatus = "yes" | "no" | "skip" | "value";
export type TodaySection = "due" | "done" | "missed";

export interface Tracker {
  id: string;
  title: string;
  emoji: string;
  type: TrackerType;
  color: string;
  unit: string;
  goalValue: number;
  isBad: boolean;
  startDate: string;
  endDate: string | null;
  repeatKind: RepeatKind;
  repeatInterval: number;
  weekdays: number[] | null;
  timesPerPeriod: number;
  sortOrder: number;
  archived: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerInput {
  title: string;
  emoji?: string;
  type: TrackerType;
  color?: string;
  unit?: string;
  goalValue?: number;
  isBad?: boolean;
  startDate?: string;
  endDate?: string | null;
  repeatKind?: RepeatKind;
  repeatInterval?: number;
  weekdays?: number[] | null;
  timesPerPeriod?: number;
  notes?: string;
  tagIds?: string[];
  milestones?: { title: string; dueDate?: string | null }[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Milestone {
  id: string;
  trackerId: string;
  title: string;
  sortOrder: number;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
}

export interface LogEntry {
  id: string;
  trackerId: string;
  date: string;
  value: number;
  status: LogStatus;
  note: string | null;
  createdAt: string;
}

export interface ProgressSnapshot {
  label: string;
  percent: number;
  pacePercent: number | null;
  onTrack: boolean;
  streak: number;
  bestStreak: number;
  successRate: number;
  current: number;
  goal: number;
  unit: string;
}

export interface TodayItem {
  tracker: Tracker;
  tags: Tag[];
  section: TodaySection;
  progress: ProgressSnapshot;
  todayLogs: LogEntry[];
  todayValue: number;
  milestones: Milestone[];
}

export interface TrackerDetail {
  tracker: Tracker;
  tags: Tag[];
  milestones: Milestone[];
  logs: LogEntry[];
  progress: ProgressSnapshot;
  calendar: { date: string; value: number; status: LogStatus | null }[];
  series: { date: string; actual: number; pace: number | null }[];
}

export interface ReportTracker {
  tracker: Tracker;
  tags: Tag[];
  progress: ProgressSnapshot;
  completed: number;
  dueCount: number;
}

export interface ReportsPayload {
  period: "week" | "month" | "year" | "all";
  from: string;
  to: string;
  overallPercent: number;
  onTrackCount: number;
  trackerCount: number;
  perfectDays: number;
  dayCount: number;
  trackers: ReportTracker[];
  trends: { date: string; percent: number }[];
  calendar: { date: string; percent: number; due: number; done: number }[];
}

export interface Template {
  id: string;
  category: string;
  title: string;
  emoji: string;
  type: TrackerType;
  color: string;
  unit: string;
  goalValue: number;
  isBad: boolean;
  repeatKind: RepeatKind;
  repeatInterval: number;
  weekdays: number[] | null;
  timesPerPeriod: number;
  notes: string;
  endInDays: number | null;
  milestones?: string[];
}
