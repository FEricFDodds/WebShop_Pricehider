import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "./migrate.js";
import * as schema from "./schema.js";
import fs from "node:fs";
import path from "node:path";

export type AtpDb = ReturnType<typeof drizzle<typeof schema>>;

let singleton: AtpDb | null = null;
let sqliteHandle: Database.Database | null = null;

export function getDb(dbPath?: string): AtpDb {
  if (singleton && !dbPath) return singleton;

  const resolved =
    dbPath ??
    process.env.ATP_DB_PATH ??
    path.resolve(process.cwd(), "../../data/atp.db");

  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(resolved);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  migrate(sqlite);

  const db = drizzle(sqlite, { schema });
  if (!dbPath) {
    singleton = db;
    sqliteHandle = sqlite;
  }
  return db;
}

export function closeDb(): void {
  if (sqliteHandle) {
    sqliteHandle.close();
    sqliteHandle = null;
    singleton = null;
  }
}
