import { ARCHETYPES } from "./archetypes.js";
import { validateCrossLayerConsistency } from "./coherence.js";
import { mockParse } from "./mockParse.js";
import { policyGate } from "./policy.js";
import { scoreProfile } from "./score.js";
import { selectOptimal } from "./select.js";
import type {
  AdaptiveTransactionProfile,
  AuditEvent,
  JobResult,
  RankedRecommendation,
  TransactionObjective,
  WebsiteSignalVector,
} from "./schemas.js";
import { TransactionObjectiveSchema } from "./schemas.js";
import type { PolicyConstraintInput } from "./policy.js";

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function audit(
  jobId: string,
  type: AuditEvent["type"],
  message: string,
  data?: Record<string, unknown>
): AuditEvent {
  return {
    id: id("evt"),
    jobId,
    ts: new Date().toISOString(),
    type,
    message,
    data,
  };
}

export function generateCandidates(
  count = 8
): AdaptiveTransactionProfile[] {
  const templates = ARCHETYPES.slice(0, Math.min(count, ARCHETYPES.length));
  return templates.map((t) => {
    const profile: AdaptiveTransactionProfile = {
      ...t,
      id: id("prof"),
      browser: { ...t.browser, viewport: { ...t.browser.viewport } },
      system: { ...t.system },
      locale: { ...t.locale },
      behavioral: { ...t.behavioral },
      identity: { ...t.identity },
      network: t.network ?? null,
      transport: t.transport ?? null,
    };
    return profile;
  });
}

export type PipelineOpts = {
  userId?: string;
  jobId?: string;
  constraints?: PolicyConstraintInput;
  /** Inject parse result (tests). Default: mockParse. */
  parseFn?: (url: string) => WebsiteSignalVector;
  maxCandidates?: number;
};

/**
 * Orchestrates: mockParse → generateCandidates → coherence filter →
 * score → policy gate → select → audit events.
 * Recommendation-only: never executes purchase/checkout.
 */
export function runPipeline(
  objectiveInput: string | TransactionObjective,
  targetUrl: string,
  opts: PipelineOpts = {}
): JobResult {
  const jobId = opts.jobId ?? id("job");
  const now = new Date().toISOString();
  const events: AuditEvent[] = [];

  const objective: TransactionObjective =
    typeof objectiveInput === "string"
      ? TransactionObjectiveSchema.parse({ text: objectiveInput })
      : TransactionObjectiveSchema.parse(objectiveInput);

  const job = {
    id: jobId,
    userId: opts.userId,
    targetUrl,
    objective,
    status: "running" as const,
    createdAt: now,
  };

  events.push(audit(jobId, "job_created", `Job created for ${targetUrl}`, { userId: opts.userId }));

  try {
    const parseFn = opts.parseFn ?? mockParse;
    const signals = parseFn(targetUrl);
    events.push(
      audit(jobId, "parse_complete", `Parsed signals (source=${signals.parseSource})`, {
        pageType: signals.pageType,
        currency: signals.commerce?.currency,
        botSignals: signals.botSignals,
      })
    );

    const raw = generateCandidates(opts.maxCandidates ?? opts.constraints?.maxCandidates ?? 8);
    const coherent: AdaptiveTransactionProfile[] = [];
    for (const p of raw) {
      const c = validateCrossLayerConsistency(p);
      if (c.ok) coherent.push(p);
      else {
        events.push(
          audit(jobId, "policy_decision", `Dropped incoherent profile ${p.archetypeId}`, {
            profileId: p.id,
            issues: c.issues,
          })
        );
      }
    }
    events.push(
      audit(jobId, "candidates_generated", `Generated ${coherent.length} coherent candidates`, {
        total: raw.length,
        coherent: coherent.length,
      })
    );

    const evaluated: RankedRecommendation[] = [];
    for (const profile of coherent) {
      const score = scoreProfile(profile, signals);
      events.push(
        audit(jobId, "profile_scored", `Scored ${profile.label}`, {
          profileId: profile.id,
          value: score.value,
          confidence: score.confidence,
        })
      );

      const decision = policyGate(profile, signals, opts.constraints ?? {}, objective);
      events.push(
        audit(jobId, "policy_decision", `${decision.outcome}: ${decision.reason}`, {
          profileId: profile.id,
          ruleId: decision.ruleId,
        })
      );

      evaluated.push({ profile, score, decision });
    }

    const recommendations = selectOptimal(evaluated);
    const blocked = evaluated.filter((e) => e.decision.outcome === "BLOCK");

    events.push(
      audit(jobId, "selection_complete", `Selected ${recommendations.length} recommendations`, {
        blocked: blocked.length,
        topValue: recommendations[0]?.score.value,
      })
    );
    events.push(audit(jobId, "job_complete", "Pipeline complete"));

    return {
      job: { ...job, status: "completed", completedAt: new Date().toISOString() },
      signals,
      recommendations,
      blocked,
      audit: events,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    events.push(audit(jobId, "job_failed", message));
    return {
      job: { ...job, status: "failed", completedAt: new Date().toISOString() },
      recommendations: [],
      blocked: [],
      audit: events,
      error: message,
    };
  }
}
