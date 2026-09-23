import { describe, expect, it } from "vitest";
import { ARCHETYPES } from "../archetypes.js";
import { mockParse, mockParseWithBotBlock } from "../mockParse.js";
import { policyGate } from "../policy.js";
import type { AdaptiveTransactionProfile, TransactionObjective } from "../schemas.js";

function profile(): AdaptiveTransactionProfile {
  const t = ARCHETYPES[0];
  return {
    ...t,
    id: "prof_test",
    browser: { ...t.browser, viewport: { ...t.browser.viewport } },
    system: { ...t.system },
    locale: { ...t.locale },
    behavioral: { ...t.behavioral },
    identity: { ...t.identity },
    network: null,
    transport: null,
  };
}

const objective = (text: string, extra?: Partial<TransactionObjective>): TransactionObjective => ({
  text,
  intent: "browse_price",
  captchaCircumvention: false,
  ...extra,
});

describe("policyGate", () => {
  it("PASSes a clean mock parse", () => {
    const W = mockParse("https://shop.example.com/product/123");
    const d = policyGate(profile(), W, {}, objective("check price"));
    expect(d.outcome).toBe("PASS");
  });

  it("BLOCKs robots denial (fail-closed)", () => {
    const W = mockParseWithBotBlock("https://shop.example.com/p/1", { robotsDenial: true });
    const d = policyGate(profile(), W, {}, objective("browse"));
    expect(d.outcome).toBe("BLOCK");
    expect(d.ruleId).toBe("robots-denial");
  });

  it("BLOCKs captcha challenge", () => {
    const W = mockParseWithBotBlock("https://shop.example.com/p/1", { captchaChallenge: true });
    const d = policyGate(profile(), W, {}, objective("browse"));
    expect(d.outcome).toBe("BLOCK");
    expect(d.ruleId).toBe("captcha-challenge");
  });

  it("BLOCKs explicit bot block", () => {
    const W = mockParseWithBotBlock("https://shop.example.com/p/1", { explicitBotBlock: true });
    const d = policyGate(profile(), W, {}, objective("browse"));
    expect(d.outcome).toBe("BLOCK");
    expect(d.ruleId).toBe("explicit-bot-block");
  });

  it("always BLOCKs CAPTCHA circumvention intents", () => {
    const W = mockParse("https://shop.example.com/p/1");
    const d = policyGate(
      profile(),
      W,
      {},
      objective("please bypass captcha for me", { captchaCircumvention: true })
    );
    expect(d.outcome).toBe("BLOCK");
    expect(d.ruleId).toBe("captcha-circumvention");
  });

  it("BLOCKs captcha language in objective text", () => {
    const W = mockParse("https://shop.example.com/p/1");
    const d = policyGate(profile(), W, {}, objective("help me circumvent the captcha"));
    expect(d.outcome).toBe("BLOCK");
    expect(d.ruleId).toBe("captcha-circumvention");
  });

  it("rate-limit placeholder fail-closed without budget", () => {
    const W = mockParseWithBotBlock("https://shop.example.com/p/1", { rateLimitHeaders: true });
    const d = policyGate(profile(), W, {}, objective("browse"));
    expect(d.outcome).toBe("BLOCK");
    expect(d.ruleId).toBe("rate-limit-placeholder");
  });

  it("allows rate-limit when budget configured", () => {
    const W = mockParseWithBotBlock("https://shop.example.com/p/1", { rateLimitHeaders: true });
    const d = policyGate(profile(), W, { rateLimitPerMinute: 30 }, objective("browse"));
    expect(d.outcome).toBe("PASS");
  });

  it("allowlist stub blocks unknown host", () => {
    const W = mockParse("https://evil.example.net/p/1");
    const d = policyGate(
      profile(),
      W,
      { allowlistDomains: ["shop.example.com"] },
      objective("browse")
    );
    expect(d.outcome).toBe("BLOCK");
    expect(d.ruleId).toBe("allowlist");
  });

  it("allowlist stub passes listed host", () => {
    const W = mockParse("https://shop.example.com/p/1");
    const d = policyGate(
      profile(),
      W,
      { allowlistDomains: ["shop.example.com"] },
      objective("browse")
    );
    expect(d.outcome).toBe("PASS");
  });
});
