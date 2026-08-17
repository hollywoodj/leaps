import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trackers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎯',
  type TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#0A84FF',
  unit TEXT NOT NULL DEFAULT '',
  goal_value REAL NOT NULL DEFAULT 1,
  is_bad INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT,
  repeat_kind TEXT NOT NULL DEFAULT 'daily',
  repeat_interval INTEGER NOT NULL DEFAULT 1,
  weekdays TEXT,
  times_per_period INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tracker_tags (
  tracker_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (tracker_id, tag_id),
  FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  tracker_id TEXT NOT NULL,
  date TEXT NOT NULL,
  value REAL NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_logs_tracker_date ON logs(tracker_id, date);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  tracker_id TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  due_date TEXT,
  FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE
);
`;

let db: Database.Database | null = null;

export function getDbPath(): string {
  return process.env.LEAPS_DB_PATH || path.join(process.cwd(), "data", "leaps.db");
}

export function openDatabase(dbPath = getDbPath()): Database.Database {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  instance.exec(SCHEMA);
  instance.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1')").run();
  return instance;
}

export function getDb(): Database.Database {
  if (!db) db = openDatabase();
  return db;
}

export function setDb(instance: Database.Database | null): void {
  db = instance;
}

export function closeDb(): void {
  db?.close();
  db = null;
}
