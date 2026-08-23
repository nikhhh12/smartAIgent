import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "sqlite.db");

// Singleton connection to prevent SQLite locking across Next.js reloads
let sqliteInstance: Database.Database | null = null;

function getSqliteInstance(): Database.Database {
  if (!sqliteInstance) {
    sqliteInstance = new Database(dbPath, { timeout: 10000 });
    try {
      sqliteInstance.pragma("journal_mode = WAL");
    } catch {
      // Ignore WAL pragma concurrency errors during static build workers
    }
  }
  return sqliteInstance;
}

export const db = drizzle(getSqliteInstance(), { schema });

// Auto-initialize tables if they don't exist
export function initDb() {
  const sqlite = getSqliteInstance();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      original_request TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interpretations (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES workflows(id),
      task_title TEXT NOT NULL,
      summary TEXT NOT NULL,
      priority TEXT NOT NULL,
      deadline TEXT,
      missing_information TEXT NOT NULL,
      automatable_actions TEXT NOT NULL,
      human_confirmation_required TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES workflows(id),
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      reason TEXT NOT NULL,
      tool_name TEXT,
      tool_input TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES workflows(id),
      action_id TEXT REFERENCES action_items(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL,
      deadline TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS communication_drafts (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES workflows(id),
      action_id TEXT REFERENCES action_items(id),
      recipient TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES workflows(id),
      action_id TEXT REFERENCES action_items(id),
      reminder_text TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tool_executions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES workflows(id),
      action_id TEXT REFERENCES action_items(id),
      tool_name TEXT NOT NULL,
      input TEXT NOT NULL,
      output TEXT,
      status TEXT NOT NULL,
      error TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES workflows(id),
      action_id TEXT NOT NULL REFERENCES action_items(id),
      status TEXT NOT NULL,
      original_content TEXT NOT NULL,
      edited_content TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES workflows(id),
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

// Call on module load
initDb();
