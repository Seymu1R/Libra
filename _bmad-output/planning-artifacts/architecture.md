---
project: Tərəzi
derived_from: ProjectDocs/original-brief.md, _bmad-output/planning-artifacts/prd.md
status: draft — awaiting owner approval
date: 2026-10-20
---

# Architecture — Tərəzi

## 1. Layering

```
lib/            pure TypeScript — no Next.js, no Prisma, no fetch side effects
  config.ts       ALL thresholds + competition keys (single source)
  analysis/       fair probs, median consensus, disagreement, double chance, best odds
  templates/      greedy template builder, combine (product / fair odds)
  odds-api/       zod schemas + types for The Odds API v4 responses; quota header parser
  time.ts         Asia/Baku formatting helpers (Intl, az-AZ)
server/         server-only (imports 'server-only'); may use Prisma + fetch
  db.ts           Prisma client singleton
  odds-client.ts  HTTP client (real) + mock client (fixtures) behind one interface
  sync.service.ts orchestrates a sync: cooldown → per-competition fetch → persist snapshot
  analysis.service.ts  loads a stored snapshot → calls lib/analysis → view models
  templates.service.ts loads analysis → lib/templates → persists Template/TemplateLeg
app/            Next.js App Router (UI + route handlers only, thin)
  page.tsx                 Matçlar (matches view)
  templates/page.tsx       Kuponlar (templates + custom builder)
  api/sync/route.ts        POST — run sync
  api/status/route.ts      GET  — last sync, credits, cooldown
  api/templates/route.ts   POST — regenerate templates from stored data (no API call)
components/     React UI components (Tailwind)
fixtures/       mock API JSON (sports, events, odds per competition)
prisma/         schema.prisma (+ migrations)
```

Dependency direction: `app → server → lib`. `lib` never imports from `server` or `app`.
`ODDS_API_KEY` is read only in `server/odds-client.ts`.

## 2. The Odds API usage (to be confirmed against official docs in Story 1.1)

| Call | Cost | Use |
|---|---|---|
| `GET /v4/sports` | free | verify the 8 sport keys (Story 1.1), persisted as a fixture |
| `GET /v4/sports/{sport}/events?commenceTimeFrom&commenceTimeTo` | free | per competition: are there matches in the window? If 0 → **skip the paid odds call** |
| `GET /v4/sports/{sport}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&commenceTimeFrom&commenceTimeTo` | expected markets × regions = **2 credits / competition** | the actual snapshot |

Full sync of 8 competitions ≈ up to 16 credits (free tier is 500/month — to be verified). ➕ Story 8.1: + NBA (`h2h,spreads,totals`) = 3 → 19 credits.
Every call logs `x-requests-remaining / used / last` to `ApiCallLog`; latest remaining is shown in the header.
All responses parsed with **zod**; a shape mismatch fails that competition (not the whole sync) with a clear error.

## 3. Data model (Prisma, SQLite now, Postgres-portable)

Brief's model **plus** two additions marked ➕ (need approval):

- `Sync` — id, startedAt, finishedAt?, status (`running|success|partial|failed`), creditsUsed, creditsRemaining?, competitionResults (JSON string: `{key, status, matches, error?, credits}`[])
- `Match` — id (API event id), competition, homeTeam, awayTeam, commenceTime, homeScore?, awayScore?, completed (default false) — upserted; shared across syncs
- `OddsSnapshot` — id, syncId, matchId, bookmaker, market (`h2h|totals`), outcome, point?, price — indexed on (syncId, matchId)
- `Template` — id, createdAt, syncId, type (`SABIT|BALANSLI|RISKLI|CUSTOM`), combinedProbability, fairOdds, ➕ status (`PENDING|WON|LOST|VOID`, default PENDING), ➕ settledAt? — Phase 2 ready
- `TemplateLeg` — id, templateId, matchId, market (`1X2|DC|OU25`), selection, probability, bookmakerCount, ➕ result? (Phase 2)
- ➕ `ApiCallLog` — id, at, endpoint, status, requestsRemaining?, requestsUsed?, requestsLast? — satisfies "log on every call + persist latest remaining" also for calls outside a sync (e.g. `/v4/sports`)

Portability rules: no SQLite-specific SQL; JSON stored as `String` (Postgres switch can move to `Json`); enums as strings validated in code.

## 4. Analysis algorithm (lib/analysis)

Per match, per market (`h2h` = 3 outcomes; `totals` restricted to `point === 2.5`, Over/Under — ➕ Story 7.6: 2.5 / 3.5 / 4.5, the best-covered line per match (`OU25|OU35|OU45`)):
1. For each bookmaker with a **complete** outcome set: `implied_i = 1/price_i`; `fair_i = implied_i / Σ implied`.
   Incomplete/invalid (price ≤ 1, missing outcome) bookmaker markets are dropped.
2. `bookmakerCount` = bookmakers that passed step 1 for that market. Market skipped if `< MIN_BOOKMAKERS`. Match skipped if 1X2 is skipped.
3. Consensus: per outcome **median** of `fair_i` (even n → mean of two middle values), then renormalize to Σ = 1.
4. Disagreement per outcome: `max(fair_i) − min(fair_i)`.
5. Double chance (derived): `1X = H + D`, `X2 = D + A`, `12 = H + A` from the renormalized 1X2 consensus. Disagreement for DC = max − min of per-bookmaker `(fair_H + fair_D)` etc. No best odds (not fetched) → shows fair odds only.
6. Best odds per selection: max price across bookmakers + bookmaker name (ties → alphabetical, deterministic).

## 5. Templates (lib/templates)

- Candidate per match = its single best selection among all markets that satisfies `probability ≥ minLegProbability` and `disagreement ≤ MAX_DISAGREEMENT`.
- Sort: probability desc → disagreement asc → matchId asc (fully deterministic).
- Take the first `maxLegs`; if fewer than `minLegs` candidates → template not produced, UI shows "Kifayət qədər uyğun seçim yoxdur".
- `combinedProbability = Π p_i`, `fairOdds = 1 / combinedProbability`. UI states the independence assumption.
- Custom template: client-side using the same `lib/templates/combine.ts`; one leg per match enforced in UI.
- Templates are generated from a stored sync; regenerating for the same sync replaces its non-custom templates.

## 6. Sync flow

1. Reject if a `running` sync exists, or last non-failed sync started < `SYNC_COOLDOWN_MINUTES` ago → 429 with remaining minutes (Azerbaijani message).
2. Create `Sync(running)`.
3. For each selected competition, sequentially: events (free) → if any in window, odds (paid) → filter `commenceTime > now && ≤ now + SYNC_DAYS_AHEAD` → upsert `Match`, insert `OddsSnapshot`s. Errors are caught per competition.
4. Finish: status `success` / `partial` / `failed`, credits used/remaining. Then auto-generate templates.

`USE_MOCK_DATA=true` swaps in the fixture client (same interface; fixture commence times are shifted relative to "now" so they always fall in the window). Cooldown is configurable separately for mock mode (`MOCK_COOLDOWN_MINUTES`, default 0).

## 7. UI

Azerbaijani labels; `Intl.DateTimeFormat('az-AZ', { timeZone: 'Asia/Baku' })`.
Header: "Sinxron et" + competition multi-select, last sync time, remaining credits, cooldown countdown.
Matçlar: grouped by competition — kickoff, 1X2 / DC / Ü/A 2.5 consensus %, bookmaker count, disagreement, best odds (+ bookmaker).
Kuponlar: cards (Sabit / Balanslı / Riskli) + custom builder; persistent disclaimer: "Ehtimallar bazarın təxminidir, zəmanət deyil."

## 8. Testing

- Vitest unit tests for all of `lib/` (hand-computed expected values, edge cases: even-count median, incomplete bookmakers, missing 2.5 line, ties).
- Service tests for `sync.service` with the mock client + an in-memory/temp SQLite DB (cooldown, partial failure).
- Fixtures under `fixtures/` double as dev data.

## 9. Open decisions (need owner answer — see epics.md "Questions")
