import type Database from "better-sqlite3";

/** Simple SQL migrate for M0 (no drizzle-kit required to boot). */
export function migrate(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      target_url TEXT NOT NULL,
      objective_json TEXT NOT NULL,
      status TEXT NOT NULL,
      result_json TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      ts TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      data_json TEXT,
      seq INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_job ON audit_events(job_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_id);
  `);
}
