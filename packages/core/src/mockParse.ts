import type { WebsiteSignalVector } from "./schemas.js";

/**
 * Mock website parser. Returns a realistic fixture W that looks like an
 * e-commerce product page with geo/device personalization cues.
 *
 * M1: replace with a real Playwright-based parser. Do not add bot-evasion,
 * TLS fingerprint spoofing, or residential proxy logic here.
 */
export function mockParse(url: string): WebsiteSignalVector {
  let host = "example.com";
  try {
    host = new URL(url).hostname;
  } catch {
    /* keep default */
  }

  // Light host-based variation so different sample URLs feel distinct
  const isUk = /\.(uk|co\.uk)$/i.test(host) || /uk\./i.test(host);
  const isEu = /\.(de|fr|eu)$/i.test(host) || /(amazon\.de|zalando)/i.test(host);
  const isJp = /\.jp$/i.test(host) || /rakuten|amazon\.co\.jp/i.test(host);

  let currency = "USD";
  let detectedLocale = "en-US";
  let currencyHints = ["USD", "CAD"];
  let shippingRegions = ["US", "CA"];

  if (isUk) {
    currency = "GBP";
    detectedLocale = "en-GB";
    currencyHints = ["GBP", "EUR"];
    shippingRegions = ["GB", "IE"];
  } else if (isEu) {
    currency = "EUR";
    detectedLocale = host.endsWith(".fr") ? "fr-FR" : "de-DE";
    currencyHints = ["EUR", "GBP"];
    shippingRegions = ["DE", "FR", "NL"];
  } else if (isJp) {
    currency = "JPY";
    detectedLocale = "ja-JP";
    currencyHints = ["JPY"];
    shippingRegions = ["JP"];
  }

  const path = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return "/";
    }
  })();

  const pageType: WebsiteSignalVector["pageType"] =
    /\/(product|dp|item|p)\b|\/products?\//.test(path)
      ? "product"
      : /\/(category|c|collection|shop)\b/.test(path)
        ? "category"
        : path === "/" || path === ""
          ? "home"
          : "product";

  // Fixture: open e-commerce product page (no bot blocks by default)
  return {
    url,
    title: `Sample Product — ${host}`,
    pageType,
    geoPersonalization: {
      detectedLocale,
      currencyHints,
      shippingRegions,
      geoPriceVariance: true,
    },
    devicePersonalization: {
      responsiveBreakpoints: [640, 768, 1024, 1280],
      mobileOptimized: true,
      touchTargets: true,
    },
    botSignals: {
      robotsDenial: false,
      captchaChallenge: false,
      explicitBotBlock: false,
      rateLimitHeaders: false,
    },
    commerce: {
      priceVisible: true,
      currency,
      inStock: true,
      requiresAccount: false,
    },
    parsedAt: new Date().toISOString(),
    parseSource: "mock",
  };
}

/**
 * Helper for tests: build a W that trips bot-denial signals.
 */
export function mockParseWithBotBlock(
  url: string,
  flags: Partial<NonNullable<WebsiteSignalVector["botSignals"]>>
): WebsiteSignalVector {
  const base = mockParse(url);
  return {
    ...base,
    botSignals: {
      robotsDenial: false,
      captchaChallenge: false,
      explicitBotBlock: false,
      rateLimitHeaders: false,
      ...flags,
    },
  };
}
