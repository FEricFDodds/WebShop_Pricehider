/**
 * Worker entry: executes the ATP pipeline and persists results.
 * M0: invoked in-process from the API (sync). Kept as a separate package
 * so M1 can move this to a real job queue without reshaping call sites.
 */
import {
  runPipeline,
  type JobResult,
  type PipelineOpts,
  type TransactionObjective,
} from "@atp/core";
import { getDb, saveJobResult } from "@atp/db";

export type RunJobInput = {
  targetUrl: string;
  objective: string | TransactionObjective;
  userId?: string;
  jobId?: string;
  constraints?: PipelineOpts["constraints"];
  dbPath?: string;
};

export function executeJob(input: RunJobInput): JobResult {
  const result = runPipeline(input.objective, input.targetUrl, {
    userId: input.userId,
    jobId: input.jobId,
    constraints: input.constraints,
  });

  const db = getDb(input.dbPath);
  saveJobResult(db, result);
  return result;
}

export { runPipeline };
