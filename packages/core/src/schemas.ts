import { z } from "zod";

/** Signals observed / inferred from a target website parse. */
export const WebsiteSignalVectorSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  pageType: z.enum(["product", "category", "home", "checkout", "other"]).default("other"),
  geoPersonalization: z
    .object({
      detectedLocale: z.string().optional(),
      currencyHints: z.array(z.string()).default([]),
      shippingRegions: z.array(z.string()).default([]),
      geoPriceVariance: z.boolean().default(false),
    })
    .optional(),
  devicePersonalization: z
    .object({
      responsiveBreakpoints: z.array(z.number()).default([]),
      mobileOptimized: z.boolean().default(true),
      touchTargets: z.boolean().default(false),
    })
    .optional(),
  botSignals: z
    .object({
      robotsDenial: z.boolean().default(false),
      captchaChallenge: z.boolean().default(false),
      explicitBotBlock: z.boolean().default(false),
      rateLimitHeaders: z.boolean().default(false),
    })
    .default({}),
  commerce: z
    .object({
      priceVisible: z.boolean().default(false),
      currency: z.string().optional(),
      inStock: z.boolean().optional(),
      requiresAccount: z.boolean().default(false),
    })
    .optional(),
  parsedAt: z.string().datetime(),
  parseSource: z.enum(["mock", "playwright"]).default("mock"),
});
export type WebsiteSignalVector = z.infer<typeof WebsiteSignalVectorSchema>;

/** Network layer — optional in MVP. */
export const NetworkLayerSchema = z
  .object({
    egressRegion: z.string().optional(),
    asnHint: z.string().optional(),
    latencyMsBudget: z.number().optional(),
  })
  .nullable()
  .optional();
export type NetworkLayer = z.infer<typeof NetworkLayerSchema>;

/** Transport layer — optional in MVP (no TLS spoofing). */
export const TransportLayerSchema = z
  .object({
    httpVersion: z.enum(["1.1", "2", "3"]).optional(),
    acceptEncoding: z.array(z.string()).optional(),
  })
  .nullable()
  .optional();
export type TransportLayer = z.infer<typeof TransportLayerSchema>;

export const BrowserLayerSchema = z.object({
  userAgent: z.string(),
  engine: z.enum(["chromium", "firefox", "webkit", "other"]),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  deviceScaleFactor: z.number().positive().default(1),
  touchEnabled: z.boolean().default(false),
  cookiesEnabled: z.boolean().default(true),
});
export type BrowserLayer = z.infer<typeof BrowserLayerSchema>;

export const SystemLayerSchema = z.object({
  platform: z.enum(["windows", "macos", "linux", "ios", "android", "other"]),
  deviceClass: z.enum(["desktop", "laptop", "tablet", "mobile"]),
  cpuCoresHint: z.number().int().positive().optional(),
  memoryGbHint: z.number().positive().optional(),
});
export type SystemLayer = z.infer<typeof SystemLayerSchema>;

export const LocaleLayerSchema = z.object({
  language: z.string(), // BCP-47 primary, e.g. "en"
  locale: z.string(), // e.g. "en-US"
  timezone: z.string(), // IANA, e.g. "America/Chicago"
  currency: z.string(), // ISO 4217, e.g. "USD"
  acceptLanguage: z.string().optional(),
});
export type LocaleLayer = z.infer<typeof LocaleLayerSchema>;

export const BehavioralLayerSchema = z.object({
  sessionDepth: z.enum(["shallow", "browse", "research", "intent"]),
  scrollPattern: z.enum(["skim", "read", "compare"]).optional(),
  dwellSecondsHint: z.number().nonnegative().optional(),
  referrerClass: z.enum(["direct", "search", "social", "email", "other"]).default("direct"),
});
export type BehavioralLayer = z.infer<typeof BehavioralLayerSchema>;

export const IdentityLayerSchema = z.object({
  accountState: z.enum(["anonymous", "guest", "returning", "authenticated"]),
  loyaltyHint: z.boolean().default(false),
  /** Recommendation-only: never stores payment credentials. */
  paymentAffinity: z.enum(["none", "card_saved_hint", "wallet_hint"]).default("none"),
});
export type IdentityLayer = z.infer<typeof IdentityLayerSchema>;

export const AdaptiveTransactionProfileSchema = z.object({
  id: z.string(),
  archetypeId: z.string(),
  label: z.string(),
  network: NetworkLayerSchema,
  transport: TransportLayerSchema,
  browser: BrowserLayerSchema,
  system: SystemLayerSchema,
  locale: LocaleLayerSchema,
  behavioral: BehavioralLayerSchema,
  identity: IdentityLayerSchema,
});
export type AdaptiveTransactionProfile = z.infer<typeof AdaptiveTransactionProfileSchema>;

export const TransactionObjectiveSchema = z.object({
  text: z.string().min(1),
  intent: z
    .enum([
      "browse_price",
      "compare_availability",
      "research_product",
      "estimate_shipping",
      "other",
    ])
    .default("other"),
  /** Always blocked by policy — present only for fail-closed detection. */
  captchaCircumvention: z.boolean().default(false),
});
export type TransactionObjective = z.infer<typeof TransactionObjectiveSchema>;

export const PolicyConstraintSchema = z.object({
  allowlistDomains: z.array(z.string()).optional(),
  maxCandidates: z.number().int().positive().default(10),
  rateLimitPerMinute: z.number().int().positive().optional(),
  blockCaptchaCircumvention: z.boolean().default(true),
});
export type PolicyConstraint = z.infer<typeof PolicyConstraintSchema>;

export const PolicyDecisionSchema = z.object({
  outcome: z.enum(["PASS", "BLOCK"]),
  reason: z.string(),
  ruleId: z.string().optional(),
  profileId: z.string().optional(),
});
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;

export const ScoreResultSchema = z.object({
  value: z.number(),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});
export type ScoreResult = z.infer<typeof ScoreResultSchema>;

export const RankedRecommendationSchema = z.object({
  profile: AdaptiveTransactionProfileSchema,
  score: ScoreResultSchema,
  decision: PolicyDecisionSchema,
  rank: z.number().int().positive().optional(),
});
export type RankedRecommendation = z.infer<typeof RankedRecommendationSchema>;

export const AuditEventSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  ts: z.string().datetime(),
  type: z.enum([
    "job_created",
    "parse_complete",
    "candidates_generated",
    "profile_scored",
    "policy_decision",
    "selection_complete",
    "job_complete",
    "job_failed",
  ]),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const JobStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const JobSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  targetUrl: z.string().url(),
  objective: TransactionObjectiveSchema,
  status: JobStatusSchema,
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});
export type Job = z.infer<typeof JobSchema>;

export const JobResultSchema = z.object({
  job: JobSchema,
  signals: WebsiteSignalVectorSchema.optional(),
  recommendations: z.array(RankedRecommendationSchema).default([]),
  blocked: z.array(RankedRecommendationSchema).default([]),
  audit: z.array(AuditEventSchema).default([]),
  error: z.string().optional(),
});
export type JobResult = z.infer<typeof JobResultSchema>;

export const CreateJobRequestSchema = z.object({
  targetUrl: z.string().url(),
  objective: z.union([
    z.string().min(1),
    TransactionObjectiveSchema,
  ]),
  userId: z.string().optional(),
});
export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
