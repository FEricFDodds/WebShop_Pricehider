import type {
  AdaptiveTransactionProfile,
  PolicyConstraint,
  PolicyDecision,
  TransactionObjective,
  WebsiteSignalVector,
} from "./schemas.js";

export type PolicyConstraintInput = Partial<PolicyConstraint>;

/**
 * Fail-closed policy gate.
 * Blocks when website signals indicate denial / captcha / bot block,
 * always blocks CAPTCHA circumvention intents, applies rate-limit
 * placeholder and allowlist stub.
 */
export function policyGate(
  P: AdaptiveTransactionProfile,
  W: WebsiteSignalVector,
  userConstraints: PolicyConstraintInput = {},
  objective?: TransactionObjective
): PolicyDecision {
  const constraints: PolicyConstraint = {
    maxCandidates: userConstraints.maxCandidates ?? 10,
    blockCaptchaCircumvention: userConstraints.blockCaptchaCircumvention ?? true,
    allowlistDomains: userConstraints.allowlistDomains,
    rateLimitPerMinute: userConstraints.rateLimitPerMinute,
  };

  // Always block CAPTCHA circumvention intents
  if (
    constraints.blockCaptchaCircumvention !== false &&
    (objective?.captchaCircumvention === true ||
      /circumvent|bypass\s*captcha|solve\s*captcha/i.test(objective?.text ?? ""))
  ) {
    return {
      outcome: "BLOCK",
      reason: "CAPTCHA circumvention intent is always blocked",
      ruleId: "captcha-circumvention",
      profileId: P.id,
    };
  }

  const bot = W.botSignals ?? {
    robotsDenial: false,
    captchaChallenge: false,
    explicitBotBlock: false,
    rateLimitHeaders: false,
  };

  if (bot.robotsDenial) {
    return {
      outcome: "BLOCK",
      reason: "Target site signals robots denial",
      ruleId: "robots-denial",
      profileId: P.id,
    };
  }

  if (bot.captchaChallenge) {
    return {
      outcome: "BLOCK",
      reason: "Target site presents a CAPTCHA challenge",
      ruleId: "captcha-challenge",
      profileId: P.id,
    };
  }

  if (bot.explicitBotBlock) {
    return {
      outcome: "BLOCK",
      reason: "Target site explicitly blocks bots",
      ruleId: "explicit-bot-block",
      profileId: P.id,
    };
  }

  // Rate-limit placeholder (fail-closed when signal present and no budget configured)
  if (bot.rateLimitHeaders && constraints.rateLimitPerMinute === undefined) {
    return {
      outcome: "BLOCK",
      reason: "Rate-limit headers observed; no rate budget configured (fail-closed)",
      ruleId: "rate-limit-placeholder",
      profileId: P.id,
    };
  }

  // Allowlist stub: if allowlist provided, domain must match
  if (constraints.allowlistDomains && constraints.allowlistDomains.length > 0) {
    let host: string;
    try {
      host = new URL(W.url).hostname;
    } catch {
      return {
        outcome: "BLOCK",
        reason: "Invalid target URL for allowlist check",
        ruleId: "allowlist-invalid-url",
        profileId: P.id,
      };
    }
    const allowed = constraints.allowlistDomains.some(
      (d) => host === d || host.endsWith(`.${d}`)
    );
    if (!allowed) {
      return {
        outcome: "BLOCK",
        reason: `Host ${host} is not on allowlist`,
        ruleId: "allowlist",
        profileId: P.id,
      };
    }
  }

  return {
    outcome: "PASS",
    reason: "All policy checks passed",
    ruleId: "pass",
    profileId: P.id,
  };
}
