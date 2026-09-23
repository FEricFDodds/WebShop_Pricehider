import type { AdaptiveTransactionProfile } from "./schemas.js";

export type CoherenceIssue = {
  ruleId: string;
  severity: "error" | "warning";
  message: string;
};

export type CoherenceResult = {
  ok: boolean;
  issues: CoherenceIssue[];
};

/** Mobile / tablet device classes expect compact viewports and touch. */
const MOBILE_CLASSES = new Set(["mobile", "tablet"]);
const DESKTOP_CLASSES = new Set(["desktop", "laptop"]);

/** Loose locale → expected currency / timezone region prefixes. */
const LOCALE_EXPECTATIONS: Record<
  string,
  { currencies: string[]; tzPrefixes: string[]; languages: string[] }
> = {
  "en-US": { currencies: ["USD"], tzPrefixes: ["America/"], languages: ["en"] },
  "en-GB": { currencies: ["GBP"], tzPrefixes: ["Europe/London"], languages: ["en"] },
  "en-CA": { currencies: ["CAD"], tzPrefixes: ["America/"], languages: ["en", "fr"] },
  "en-AU": { currencies: ["AUD"], tzPrefixes: ["Australia/"], languages: ["en"] },
  "de-DE": { currencies: ["EUR"], tzPrefixes: ["Europe/"], languages: ["de"] },
  "fr-FR": { currencies: ["EUR"], tzPrefixes: ["Europe/"], languages: ["fr"] },
  "ja-JP": { currencies: ["JPY"], tzPrefixes: ["Asia/Tokyo"], languages: ["ja"] },
};

/**
 * Validate cross-layer consistency of a profile.
 * Returns ok=false when any error-severity issue is found.
 */
export function validateCrossLayerConsistency(
  P: AdaptiveTransactionProfile
): CoherenceResult {
  const issues: CoherenceIssue[] = [];
  const { browser, system, locale } = P;

  // Rule: mobile/tablet device vs desktop-sized resolution
  if (MOBILE_CLASSES.has(system.deviceClass)) {
    if (browser.viewport.width >= 1200) {
      issues.push({
        ruleId: "mobile-vs-desktop-resolution",
        severity: "error",
        message: `deviceClass=${system.deviceClass} but viewport width=${browser.viewport.width} looks desktop-sized`,
      });
    }
    if (!browser.touchEnabled) {
      issues.push({
        ruleId: "mobile-requires-touch",
        severity: "error",
        message: `deviceClass=${system.deviceClass} requires touchEnabled=true`,
      });
    }
  }

  // Rule: desktop/laptop should not claim tiny phone viewports
  if (DESKTOP_CLASSES.has(system.deviceClass)) {
    if (browser.viewport.width < 800) {
      issues.push({
        ruleId: "desktop-vs-mobile-resolution",
        severity: "error",
        message: `deviceClass=${system.deviceClass} but viewport width=${browser.viewport.width} looks mobile-sized`,
      });
    }
    if (browser.touchEnabled && system.deviceClass === "desktop") {
      issues.push({
        ruleId: "desktop-unexpected-touch",
        severity: "warning",
        message: "desktop profile has touchEnabled=true (unusual)",
      });
    }
  }

  // Rule: platform vs deviceClass pairing
  if (system.platform === "ios" && !["mobile", "tablet"].includes(system.deviceClass)) {
    issues.push({
      ruleId: "ios-device-class",
      severity: "error",
      message: "ios platform must be mobile or tablet",
    });
  }
  if (system.platform === "android" && system.deviceClass === "desktop") {
    issues.push({
      ruleId: "android-desktop",
      severity: "error",
      message: "android platform cannot be desktop",
    });
  }

  // Rule: locale language vs currency / timezone consistency
  const expect = LOCALE_EXPECTATIONS[locale.locale];
  if (expect) {
    if (!expect.currencies.includes(locale.currency)) {
      issues.push({
        ruleId: "locale-currency-mismatch",
        severity: "error",
        message: `locale=${locale.locale} expects currency in [${expect.currencies.join(", ")}] got ${locale.currency}`,
      });
    }
    const tzOk = expect.tzPrefixes.some((p) => locale.timezone.startsWith(p) || locale.timezone === p);
    if (!tzOk) {
      issues.push({
        ruleId: "locale-timezone-mismatch",
        severity: "error",
        message: `locale=${locale.locale} timezone=${locale.timezone} does not match expected region`,
      });
    }
    if (!expect.languages.includes(locale.language)) {
      issues.push({
        ruleId: "locale-language-mismatch",
        severity: "warning",
        message: `locale=${locale.locale} language=${locale.language} is unexpected`,
      });
    }
  }

  // Rule: language should be prefix of locale tag
  const localeLang = locale.locale.split("-")[0]?.toLowerCase();
  if (localeLang && locale.language.toLowerCase() !== localeLang) {
    // fr-CA with language en is allowed via expectations; only warn if no expectation entry
    if (!expect) {
      issues.push({
        ruleId: "language-locale-prefix",
        severity: "warning",
        message: `language=${locale.language} does not match locale prefix ${localeLang}`,
      });
    }
  }

  // Rule: UA engine vs browser.engine field
  const ua = browser.userAgent.toLowerCase();
  if (browser.engine === "firefox" && !ua.includes("firefox")) {
    issues.push({
      ruleId: "engine-ua-mismatch",
      severity: "error",
      message: "engine=firefox but userAgent does not contain Firefox",
    });
  }
  if (browser.engine === "webkit" && !ua.includes("safari")) {
    issues.push({
      ruleId: "engine-ua-mismatch",
      severity: "error",
      message: "engine=webkit but userAgent does not look like Safari",
    });
  }

  const hasError = issues.some((i) => i.severity === "error");
  return { ok: !hasError, issues };
}
