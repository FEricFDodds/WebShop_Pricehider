/**
 * Quick smoke: run pipeline via worker (no HTTP server required).
 * Also exercises DB persistence round-trip.
 */
import { executeJob } from "@atp/worker";
import { getDb, getJobResult, closeDb } from "@atp/db";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../../data/atp-smoke.db");

const result = executeJob({
  targetUrl: "https://shop.example.com/product/adaptive-widget",
  objective: "Compare price and shipping for a US shopper",
  userId: "smoke-tester",
  dbPath,
});

const db = getDb(dbPath);
const loaded = getJobResult(db, result.job.id);

console.log(
  JSON.stringify(
    {
      ok: result.job.status === "completed" && !!loaded,
      jobId: result.job.id,
      recommendations: result.recommendations.length,
      blocked: result.blocked.length,
      auditEvents: result.audit.length,
      top: result.recommendations[0]
        ? {
            label: result.recommendations[0].profile.label,
            value: result.recommendations[0].score.value,
            confidence: result.recommendations[0].score.confidence,
            rank: result.recommendations[0].rank,
          }
        : null,
      persisted: !!loaded,
    },
    null,
    2
  )
);

closeDb();

if (result.job.status !== "completed" || !loaded || result.recommendations.length < 1) {
  process.exit(1);
}
