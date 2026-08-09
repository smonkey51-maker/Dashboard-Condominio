import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const databasePath = process.env.DATABASE_PATH || "./data/euganeo.sqlite";
mkdirSync(dirname(databasePath), { recursive: true });

const globalDb = globalThis as typeof globalThis & { euganeoDb?: DatabaseSync };
export const db = globalDb.euganeoDb ?? new DatabaseSync(databasePath);
globalDb.euganeoDb = db;

db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS synced_items (
    source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    sender TEXT,
    summary TEXT,
    occurred_at TEXT NOT NULL,
    ends_at TEXT,
    location TEXT,
    source_url TEXT,
    unread INTEGER NOT NULL DEFAULT 0,
    attachment_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (source, external_id)
  );
  CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    synced_at TEXT NOT NULL,
    email_count INTEGER NOT NULL,
    event_count INTEGER NOT NULL,
    status TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS synced_items_date_idx ON synced_items(occurred_at DESC);
`);

export type SyncedItem = {
  source: string;
  external_id: string;
  kind: string;
  title: string;
  sender: string | null;
  summary: string | null;
  occurred_at: string;
  ends_at: string | null;
  location: string | null;
  source_url: string | null;
  unread: number;
  attachment_count: number;
};

export function dashboardData() {
  const items = db.prepare("SELECT * FROM synced_items ORDER BY occurred_at DESC LIMIT 100").all() as SyncedItem[];
  const lastRun = db.prepare("SELECT * FROM sync_runs ORDER BY synced_at DESC LIMIT 1").get() as
    | { synced_at: string; email_count: number; event_count: number; status: string }
    | undefined;
  const connected = Boolean(db.prepare("SELECT 1 FROM settings WHERE key = 'google_refresh_token'").get());
  return { items, lastRun, connected };
}

export function setSetting(key: string, value: string) {
  db.prepare(`INSERT INTO settings(key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .run(key, value, new Date().toISOString());
}

export function getSetting(key: string) {
  return (db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined)?.value;
}
