import { describe, expect, it } from "vitest";
import { ARCHETYPES } from "../archetypes.js";
import { validateCrossLayerConsistency } from "../coherence.js";
import type { AdaptiveTransactionProfile } from "../schemas.js";

function fromArchetype(index: number, overrides?: Partial<AdaptiveTransactionProfile>): AdaptiveTransactionProfile {
  const t = ARCHETYPES[index];
  return {
    ...t,
    id: `test_${index}`,
    browser: { ...t.browser, viewport: { ...t.browser.viewport }, ...overrides?.browser },
    system: { ...t.system, ...overrides?.system },
    locale: { ...t.locale, ...overrides?.locale },
    behavioral: { ...t.behavioral, ...overrides?.behavioral },
    identity: { ...t.identity, ...overrides?.identity },
    network: null,
    transport: null,
    ...overrides,
    // re-apply nested after spread
    ...(overrides?.browser ? { browser: { ...t.browser, viewport: { ...t.browser.viewport }, ...overrides.browser } } : {}),
    ...(overrides?.system ? { system: { ...t.system, ...overrides.system } } : {}),
    ...(overrides?.locale ? { locale: { ...t.locale, ...overrides.locale } } : {}),
  };
}

describe("validateCrossLayerConsistency", () => {
  it("passes all stock archetypes", () => {
    for (let i = 0; i < ARCHETYPES.length; i++) {
      const result = validateCrossLayerConsistency(fromArchetype(i));
      expect(result.ok, ARCHETYPES[i].archetypeId + ": " + JSON.stringify(result.issues)).toBe(true);
    }
  });

  it("flags mobile device with desktop resolution", () => {
    const p = fromArchetype(1, {
      browser: {
        ...ARCHETYPES[1].browser,
        viewport: { width: 1920, height: 1080 },
      },
    });
    const result = validateCrossLayerConsistency(p);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.ruleId === "mobile-vs-desktop-resolution")).toBe(true);
  });

  it("flags desktop with mobile resolution", () => {
    const p = fromArchetype(0, {
      browser: {
        ...ARCHETYPES[0].browser,
        viewport: { width: 390, height: 844 },
      },
    });
    const result = validateCrossLayerConsistency(p);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.ruleId === "desktop-vs-mobile-resolution")).toBe(true);
  });

  it("flags locale currency mismatch", () => {
    const p = fromArchetype(0, {
      locale: { ...ARCHETYPES[0].locale, currency: "JPY" },
    });
    const result = validateCrossLayerConsistency(p);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.ruleId === "locale-currency-mismatch")).toBe(true);
  });

  it("flags locale timezone mismatch", () => {
    const p = fromArchetype(0, {
      locale: { ...ARCHETYPES[0].locale, timezone: "Asia/Tokyo" },
    });
    const result = validateCrossLayerConsistency(p);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.ruleId === "locale-timezone-mismatch")).toBe(true);
  });

  it("flags mobile without touch", () => {
    const p = fromArchetype(1, {
      browser: { ...ARCHETYPES[1].browser, touchEnabled: false },
    });
    const result = validateCrossLayerConsistency(p);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.ruleId === "mobile-requires-touch")).toBe(true);
  });
});
