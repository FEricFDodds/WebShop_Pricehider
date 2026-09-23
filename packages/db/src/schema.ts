import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * M0: SQLite via better-sqlite3 for zero-ops shareability.
 * M1+: swap dialect to Postgres (drizzle-orm/postgres-js or node-postgres).
 * Schema shapes below should port with minimal changes (text JSON columns → jsonb).
 */
export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  targetUrl: text("target_url").notNull(),
  objectiveJson: text("objective_json").notNull(),
  status: text("status").notNull(),
  resultJson: text("result_json"),
  error: text("error"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  ts: text("ts").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  dataJson: text("data_json"),
  seq: integer("seq").notNull(),
});

export type JobRow = typeof jobs.$inferSelect;
export type NewJobRow = typeof jobs.$inferInsert;
export type AuditEventRow = typeof auditEvents.$inferSelect;
export type NewAuditEventRow = typeof auditEvents.$inferInsert;
