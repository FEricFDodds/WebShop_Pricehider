import type { AdaptiveTransactionProfile } from "./schemas.js";

/**
 * Template archetypes used to generate coherent multi-layer profiles.
 * Network/transport left null in M0 (no proxy / TLS spoofing).
 */
export type ArchetypeTemplate = Omit<AdaptiveTransactionProfile, "id"> & {
  archetypeId: string;
};

export const ARCHETYPES: ArchetypeTemplate[] = [
  {
    archetypeId: "us-desktop-chrome-shopper",
    label: "US Desktop Chrome Shopper",
    network: null,
    transport: null,
    browser: {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      engine: "chromium",
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      touchEnabled: false,
      cookiesEnabled: true,
    },
    system: {
      platform: "windows",
      deviceClass: "desktop",
      cpuCoresHint: 8,
      memoryGbHint: 16,
    },
    locale: {
      language: "en",
      locale: "en-US",
      timezone: "America/New_York",
      currency: "USD",
      acceptLanguage: "en-US,en;q=0.9",
    },
    behavioral: {
      sessionDepth: "intent",
      scrollPattern: "compare",
      dwellSecondsHint: 120,
      referrerClass: "search",
    },
    identity: {
      accountState: "anonymous",
      loyaltyHint: false,
      paymentAffinity: "none",
    },
  },
  {
    archetypeId: "us-mobile-safari-browser",
    label: "US Mobile Safari Browser",
    network: null,
    transport: null,
    browser: {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      engine: "webkit",
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      touchEnabled: true,
      cookiesEnabled: true,
    },
    system: {
      platform: "ios",
      deviceClass: "mobile",
      cpuCoresHint: 6,
      memoryGbHint: 6,
    },
    locale: {
      language: "en",
      locale: "en-US",
      timezone: "America/Chicago",
      currency: "USD",
      acceptLanguage: "en-US,en;q=0.9",
    },
    behavioral: {
      sessionDepth: "browse",
      scrollPattern: "skim",
      dwellSecondsHint: 45,
      referrerClass: "social",
    },
    identity: {
      accountState: "guest",
      loyaltyHint: false,
      paymentAffinity: "wallet_hint",
    },
  },
  {
    archetypeId: "uk-laptop-firefox-researcher",
    label: "UK Laptop Firefox Researcher",
    network: null,
    transport: null,
    browser: {
      userAgent:
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0",
      engine: "firefox",
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      touchEnabled: false,
      cookiesEnabled: true,
    },
    system: {
      platform: "linux",
      deviceClass: "laptop",
      cpuCoresHint: 4,
      memoryGbHint: 8,
    },
    locale: {
      language: "en",
      locale: "en-GB",
      timezone: "Europe/London",
      currency: "GBP",
      acceptLanguage: "en-GB,en;q=0.8",
    },
    behavioral: {
      sessionDepth: "research",
      scrollPattern: "read",
      dwellSecondsHint: 180,
      referrerClass: "search",
    },
    identity: {
      accountState: "returning",
      loyaltyHint: true,
      paymentAffinity: "card_saved_hint",
    },
  },
  {
    archetypeId: "de-desktop-chrome-compare",
    label: "DE Desktop Chrome Comparer",
    network: null,
    transport: null,
    browser: {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      engine: "chromium",
      viewport: { width: 1680, height: 1050 },
      deviceScaleFactor: 1,
      touchEnabled: false,
      cookiesEnabled: true,
    },
    system: {
      platform: "windows",
      deviceClass: "desktop",
      cpuCoresHint: 8,
      memoryGbHint: 16,
    },
    locale: {
      language: "de",
      locale: "de-DE",
      timezone: "Europe/Berlin",
      currency: "EUR",
      acceptLanguage: "de-DE,de;q=0.9,en;q=0.5",
    },
    behavioral: {
      sessionDepth: "research",
      scrollPattern: "compare",
      dwellSecondsHint: 200,
      referrerClass: "search",
    },
    identity: {
      accountState: "anonymous",
      loyaltyHint: false,
      paymentAffinity: "none",
    },
  },
  {
    archetypeId: "jp-mobile-chrome-shopper",
    label: "JP Mobile Chrome Shopper",
    network: null,
    transport: null,
    browser: {
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
      engine: "chromium",
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: 2.625,
      touchEnabled: true,
      cookiesEnabled: true,
    },
    system: {
      platform: "android",
      deviceClass: "mobile",
      cpuCoresHint: 8,
      memoryGbHint: 8,
    },
    locale: {
      language: "ja",
      locale: "ja-JP",
      timezone: "Asia/Tokyo",
      currency: "JPY",
      acceptLanguage: "ja-JP,ja;q=0.9,en;q=0.4",
    },
    behavioral: {
      sessionDepth: "intent",
      scrollPattern: "skim",
      dwellSecondsHint: 60,
      referrerClass: "direct",
    },
    identity: {
      accountState: "authenticated",
      loyaltyHint: true,
      paymentAffinity: "wallet_hint",
    },
  },
  {
    archetypeId: "ca-tablet-safari-browse",
    label: "CA Tablet Safari Browser",
    network: null,
    transport: null,
    browser: {
      userAgent:
        "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      engine: "webkit",
      viewport: { width: 820, height: 1180 },
      deviceScaleFactor: 2,
      touchEnabled: true,
      cookiesEnabled: true,
    },
    system: {
      platform: "ios",
      deviceClass: "tablet",
      cpuCoresHint: 8,
      memoryGbHint: 8,
    },
    locale: {
      language: "en",
      locale: "en-CA",
      timezone: "America/Toronto",
      currency: "CAD",
      acceptLanguage: "en-CA,en;q=0.9,fr-CA;q=0.7",
    },
    behavioral: {
      sessionDepth: "browse",
      scrollPattern: "read",
      dwellSecondsHint: 90,
      referrerClass: "email",
    },
    identity: {
      accountState: "guest",
      loyaltyHint: false,
      paymentAffinity: "none",
    },
  },
  {
    archetypeId: "au-laptop-chrome-intent",
    label: "AU Laptop Chrome Intent",
    network: null,
    transport: null,
    browser: {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      engine: "chromium",
      viewport: { width: 1512, height: 982 },
      deviceScaleFactor: 2,
      touchEnabled: false,
      cookiesEnabled: true,
    },
    system: {
      platform: "macos",
      deviceClass: "laptop",
      cpuCoresHint: 10,
      memoryGbHint: 16,
    },
    locale: {
      language: "en",
      locale: "en-AU",
      timezone: "Australia/Sydney",
      currency: "AUD",
      acceptLanguage: "en-AU,en;q=0.9",
    },
    behavioral: {
      sessionDepth: "intent",
      scrollPattern: "compare",
      dwellSecondsHint: 150,
      referrerClass: "search",
    },
    identity: {
      accountState: "returning",
      loyaltyHint: true,
      paymentAffinity: "card_saved_hint",
    },
  },
  {
    archetypeId: "fr-desktop-firefox-research",
    label: "FR Desktop Firefox Researcher",
    network: null,
    transport: null,
    browser: {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
      engine: "firefox",
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      touchEnabled: false,
      cookiesEnabled: true,
    },
    system: {
      platform: "windows",
      deviceClass: "desktop",
      cpuCoresHint: 6,
      memoryGbHint: 12,
    },
    locale: {
      language: "fr",
      locale: "fr-FR",
      timezone: "Europe/Paris",
      currency: "EUR",
      acceptLanguage: "fr-FR,fr;q=0.9,en;q=0.5",
    },
    behavioral: {
      sessionDepth: "research",
      scrollPattern: "read",
      dwellSecondsHint: 210,
      referrerClass: "search",
    },
    identity: {
      accountState: "anonymous",
      loyaltyHint: false,
      paymentAffinity: "none",
    },
  },
];

