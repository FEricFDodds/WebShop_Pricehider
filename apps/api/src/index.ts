import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { CreateJobRequestSchema } from "@atp/core";
import { getDb, getJobResult } from "@atp/db";
import { executeJob } from "@atp/worker";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDb = path.resolve(__dirname, "../../../data/atp.db");
process.env.ATP_DB_PATH = process.env.ATP_DB_PATH ?? defaultDb;

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    allowHeaders: ["Content-Type", "X-User-Id"],
  })
);

/** M0 multi-tester stub. Real auth (sessions/OIDC) in M1. */
function resolveUserId(c: { req: { header: (n: string) => string | undefined; query: (n: string) => string | undefined } }): string | undefined {
  return c.req.header("X-User-Id") ?? c.req.query("userId") ?? undefined;
}

app.get("/health", (c) =>
  c.json({ ok: true, service: "atp-api", milestone: "M0", ts: new Date().toISOString() })
);

app.post("/jobs", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateJobRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "invalid_request", details: parsed.error.flatten() }, 400);
  }

  const userId = parsed.data.userId ?? resolveUserId(c);
  const result = executeJob({
    targetUrl: parsed.data.targetUrl,
    objective: parsed.data.objective,
    userId,
  });

  return c.json(
    {
      id: result.job.id,
      status: result.job.status,
      results: result,
    },
    result.job.status === "failed" ? 500 : 201
  );
});

app.get("/jobs/:id", (c) => {
  const id = c.req.param("id");
  const db = getDb();
  const result = getJobResult(db, id);
  if (!result) return c.json({ error: "not_found" }, 404);
  return c.json(result);
});

const port = Number(process.env.PORT ?? 8787);

if (process.env.ATP_SKIP_LISTEN !== "1") {
  console.log(`ATP API listening on http://localhost:${port}`);
  console.log(`SQLite: ${process.env.ATP_DB_PATH}`);
  serve({ fetch: app.fetch, port });
}

export { app };
