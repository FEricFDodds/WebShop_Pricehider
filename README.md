# Adaptive Transaction Profile (ATP)

Shareable multi-user web app + API that **recommends** coherent multi-layer transaction profiles for a target site. Recommendation-only — **no purchase / checkout execution**.

Pipeline:

1. **Parse** target site → `WebsiteSignalVector` `W` (mocked in M0)
2. **Generate** coherent multi-layer `AdaptiveTransactionProfile` candidates `P`
3. **Score** predicted transaction value
4. **Policy gate** (fail-closed)
5. **Select / rank** PASS profiles
6. **Audit log** every step

## Monorepo layout

```
apps/web      Vite + React tester UI
apps/api     Hono HTTP API
apps/worker  Pipeline entry (in-process from API in M0)
packages/core  Zod schemas + pure logic (coherence, policy, score, select, pipeline)
packages/db    Drizzle schema + SQLite client (Postgres path noted for M1+)
```

## Prerequisites

- Node.js ≥ 20
- [pnpm](https://pnpm.io) 9 (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)

## Install & run (share with testers)

```bash
git clone <this-repo> atp && cd atp
pnpm install
pnpm --filter @atp/core build
pnpm --filter @atp/db build
pnpm --filter @atp/worker build
pnpm dev
```

- API: http://localhost:8787 (`GET /health`)
- Web: http://localhost:5173

Or separately:

```bash
pnpm dev:api   # port 8787
pnpm dev:web   # port 5173 (proxies /jobs and /health to API)
```

SQLite DB defaults to `data/atp.db` (created automatically). No cloud deps, no Docker required for M0.

### Smoke without UI

```bash
pnpm --filter @atp/api smoke
# or with a running API:
curl -s -X POST http://localhost:8787/jobs \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: tester-1' \
  -d '{"targetUrl":"https://shop.example.com/product/1","objective":"Check price for US shopper"}' | jq .
```

### Tests

```bash
pnpm test
# or
pnpm --filter @atp/core test
```

## Multi-tester stub (M0)

Pass `X-User-Id` header or `userId` in the JSON body / query. This is only for simulating multiple testers — **not** real auth. Real sessions/OIDC land in M1.

## What M0 does **not** do

- No Playwright / live site parsing (`mockParse` returns a realistic e-commerce fixture)
- No TLS fingerprint spoofing, residential proxies, or bot-evasion click streams
- No checkout / purchase code paths
- No real auth, rate-limit enforcement beyond a fail-closed placeholder
- SQLite only (fine for local/shared demos)

## Policy gate (fail-closed)

Blocks when `W` indicates robots denial, CAPTCHA challenge, or explicit bot block. **Always** blocks CAPTCHA circumvention intents. Rate-limit signal without a configured budget → BLOCK. Optional domain allowlist stub.

## Core types (packages/core)

| Type | Role |
|------|------|
| `WebsiteSignalVector` | Parsed site signals |
| `AdaptiveTransactionProfile` | Layers: network*, transport*, browser, system, locale, behavioral, identity |
| `TransactionObjective` | User intent text (+ structured fields) |
| `PolicyConstraint` / `PolicyDecision` | PASS/BLOCK + reason |
| `Job` / `JobResult` | Job lifecycle + ranked recommendations |
| `AuditEvent` | Append-only timeline |

\* network / transport optional/null in MVP.

## M1 next

- Replace `mockParse` with Playwright parser (still recommendation-only)
- Real auth for multi-user
- Postgres (Drizzle dialect swap; schema comments in `packages/db`)
- Async job queue for the worker package
- Stronger scoring / more coherence rules

## License

Private / internal — adjust before publishing.
