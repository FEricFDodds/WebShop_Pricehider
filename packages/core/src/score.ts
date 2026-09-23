import type {
  AdaptiveTransactionProfile,
  ScoreResult,
  WebsiteSignalVector,
} from "./schemas.js";

/**
 * Mock/heuristic scorer. Real ML / bandit scoring lands in a later milestone.
 * Returns predicted transaction value in [0, 100], confidence, and rationale.
 */
export function scoreProfile(
  P: AdaptiveTransactionProfile,
  W: WebsiteSignalVector
): ScoreResult {
  let value = 40;
  const reasons: string[] = [];

  // Device fit vs site personalization
  const mobileOpt = W.devicePersonalization?.mobileOptimized ?? true;
  if (P.system.deviceClass === "mobile" && mobileOpt) {
    value += 12;
    reasons.push("mobile profile matches mobile-optimized site");
  } else if (P.system.deviceClass === "desktop" && !mobileOpt) {
    value += 8;
    reasons.push("desktop profile for non-mobile-optimized site");
  }

  // Locale / currency alignment with geo cues
  const currencyHints = W.geoPersonalization?.currencyHints ?? [];
  const siteCurrency = W.commerce?.currency;
  if (siteCurrency && P.locale.currency === siteCurrency) {
    value += 15;
    reasons.push(`currency match (${P.locale.currency})`);
  } else if (currencyHints.includes(P.locale.currency)) {
    value += 10;
    reasons.push(`currency in geo hints (${P.locale.currency})`);
  } else if (currencyHints.length > 0) {
    value -= 5;
    reasons.push("currency outside geo hints");
  }

  // Detected locale alignment
  const detected = W.geoPersonalization?.detectedLocale;
  if (detected && (P.locale.locale === detected || P.locale.locale.startsWith(detected))) {
    value += 8;
    reasons.push(`locale aligns with detected ${detected}`);
  }

  // Behavioral depth vs page type
  if (W.pageType === "product" && ["intent", "research"].includes(P.behavioral.sessionDepth)) {
    value += 10;
    reasons.push("intent/research depth fits product page");
  }
  if (W.pageType === "category" && P.behavioral.sessionDepth === "browse") {
    value += 6;
    reasons.push("browse depth fits category page");
  }

  // Identity: sites requiring account prefer authenticated/returning
  if (W.commerce?.requiresAccount) {
    if (["authenticated", "returning"].includes(P.identity.accountState)) {
      value += 8;
      reasons.push("account state fits requiresAccount site");
    } else {
      value -= 4;
      reasons.push("anonymous/guest on requiresAccount site");
    }
  }

  // In-stock boost for intent shoppers
  if (W.commerce?.inStock && P.behavioral.sessionDepth === "intent") {
    value += 5;
    reasons.push("in-stock + intent");
  }

  // Clamp
  value = Math.max(0, Math.min(100, value));

  // Confidence: higher when we have richer commerce/geo signals
  let confidence = 0.45;
  if (W.commerce?.priceVisible) confidence += 0.15;
  if (W.geoPersonalization?.geoPriceVariance) confidence += 0.1;
  if (W.parseSource === "mock") confidence = Math.min(confidence, 0.7);
  confidence = Math.max(0.2, Math.min(0.95, confidence));

  const rationale =
    reasons.length > 0
      ? reasons.join("; ")
      : "baseline heuristic with limited site signals";

  return { value, confidence, rationale };
}
