import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { migrateDatabase, readSchemaVersion, SCHEMA_VERSION } from "./db";

describe("schema migrations", () => {
  it("upgrades a version-1 database to the current schema", () => {
    const db = new Database(":memory:");
    db.exec(`
      CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE logs (
        id TEXT PRIMARY KEY,
        tracker_id TEXT NOT NULL,
        date TEXT NOT NULL,
        value REAL NOT NULL DEFAULT 1,
        status TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE tracker_tags (
        tracker_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (tracker_id, tag_id)
      );
      CREATE TABLE milestones (
        id TEXT PRIMARY KEY,
        tracker_id TEXT NOT NULL,
        title TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        due_date TEXT
      );
      INSERT INTO meta (key, value) VALUES ('schema_version', '1');
    `);

    expect(readSchemaVersion(db)).toBe(1);
    const indexesBefore = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_logs_date'").get();
    expect(indexesBefore).toBeUndefined();

    const version = migrateDatabase(db);
    expect(version).toBe(SCHEMA_VERSION);
    expect(readSchemaVersion(db)).toBe(SCHEMA_VERSION);
    expect(db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_logs_date'").get()).toBeTruthy();
    expect(db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_milestones_tracker'").get()).toBeTruthy();

    const again = migrateDatabase(db);
    expect(again).toBe(SCHEMA_VERSION);
    db.close();
  });
});
