import { eq, asc } from "drizzle-orm";
import type { JobResult, AuditEvent } from "@atp/core";
import type { AtpDb } from "./client.js";
import { auditEvents, jobs } from "./schema.js";

export function saveJobResult(db: AtpDb, result: JobResult): void {
  const { job, audit } = result;
  db.insert(jobs)
    .values({
      id: job.id,
      userId: job.userId ?? null,
      targetUrl: job.targetUrl,
      objectiveJson: JSON.stringify(job.objective),
      status: job.status,
      resultJson: JSON.stringify(result),
      error: result.error ?? null,
      createdAt: job.createdAt,
      completedAt: job.completedAt ?? null,
    })
    .onConflictDoUpdate({
      target: jobs.id,
      set: {
        status: job.status,
        resultJson: JSON.stringify(result),
        error: result.error ?? null,
        completedAt: job.completedAt ?? null,
      },
    })
    .run();

  // Replace audit trail for job
  db.delete(auditEvents).where(eq(auditEvents.jobId, job.id)).run();
  audit.forEach((evt: AuditEvent, seq: number) => {
    db.insert(auditEvents)
      .values({
        id: evt.id,
        jobId: evt.jobId,
        ts: evt.ts,
        type: evt.type,
        message: evt.message,
        dataJson: evt.data ? JSON.stringify(evt.data) : null,
        seq,
      })
      .run();
  });
}

export function getJobResult(db: AtpDb, id: string): JobResult | null {
  const row = db.select().from(jobs).where(eq(jobs.id, id)).get();
  if (!row) return null;
  if (row.resultJson) {
    return JSON.parse(row.resultJson) as JobResult;
  }
  // Reconstruct minimal result if result_json missing
  const events = db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.jobId, id))
    .orderBy(asc(auditEvents.seq))
    .all();
  return {
    job: {
      id: row.id,
      userId: row.userId ?? undefined,
      targetUrl: row.targetUrl,
      objective: JSON.parse(row.objectiveJson),
      status: row.status as JobResult["job"]["status"],
      createdAt: row.createdAt,
      completedAt: row.completedAt ?? undefined,
    },
    recommendations: [],
    blocked: [],
    audit: events.map((e) => ({
      id: e.id,
      jobId: e.jobId,
      ts: e.ts,
      type: e.type as AuditEvent["type"],
      message: e.message,
      data: e.dataJson ? JSON.parse(e.dataJson) : undefined,
    })),
    error: row.error ?? undefined,
  };
}

export function listRecentJobs(db: AtpDb, limit = 20): JobResult["job"][] {
  const rows = db.select().from(jobs).all().slice(-limit).reverse();
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId ?? undefined,
    targetUrl: row.targetUrl,
    objective: JSON.parse(row.objectiveJson),
    status: row.status as JobResult["job"]["status"],
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
  }));
}
