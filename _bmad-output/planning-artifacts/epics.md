---
project: Tərəzi
status: draft — awaiting owner approval
date: 2026-10-20
---

# Epics & Stories — Tərəzi

Each epic = one phase from the brief. Each story gets a story file in
`_bmad-output/implementation-artifacts/` and a spec in `_bmad-output/specs/` when it is started.

## Epic 0 — Project scaffold
- **0.1** Next.js (App Router, TS strict) + Tailwind + Vitest + ESLint/Prettier + Prisma(SQLite) skeleton, `.env.example`, `lib/config.ts` stub, Azerbaijani README stub.

## Epic 1 — Odds API client + sport key verification
- **1.1** Read official v4 docs; record findings in `ProjectDocs/APIDocs/the-odds-api-v4.md`. Call `GET /v4/sports` once (free), save response as `fixtures/sports.json`, confirm the 8 keys and report any missing competition.
- **1.2** zod schemas + types for sports / events / odds responses; quota header parser (`lib/odds-api`).
- **1.3** `server/odds-client.ts`: real client (key server-side) + mock client (fixtures), `ApiCallLog` on every call. Mock odds fixtures for all 8 competitions.

## Epic 2 — DB schema + sync
- **2.1** Prisma schema (Sync, Match, OddsSnapshot, Template, TemplateLeg, ApiCallLog) + first migration.
- **2.2** `sync.service`: cooldown, running-lock, competition selection, day window, per-competition isolation, snapshot persistence.
- **2.3** `POST /api/sync`, `GET /api/status`.

## Epic 3 — Analysis library (pure, tested)
- **3.1** Fair probabilities per bookmaker/market, median + renormalize, disagreement.
- **3.2** Markets: 1X2, O/U 2.5 filter, derived double chance; MIN_BOOKMAKERS.
- **3.3** Best odds per selection; `analysis.service` (stored snapshot → view models).

## Epic 4 — Templates
- **4.1** Combine (product, fair odds) + deterministic greedy builder for Sabit / Balanslı / Riskli.
- **4.2** `templates.service` + persistence + `POST /api/templates` (regenerate, no API call).

## Epic 5 — UI (Azerbaijani)
- **5.1** Layout + header (sync button, competition picker, last sync, credits, cooldown).
- **5.2** Matçlar view grouped by competition.
- **5.3** Kuponlar view (cards) + custom template builder with live combined probability.
- **5.4** Disclaimer, empty/error states, README finalized.

## Epic 6 — Phase 2 (later, not started)
- **6.1** Fetch final scores (`/v4/sports/{sport}/scores`), settle legs/templates.
- **6.2** Calibration view (probability buckets vs. hit rate).

## Epic 7 — Kupon generatoru + təkrar qaydası (owner request 2026-10-21)
- **7.1** No-repeat rule: Sabit/Balanslı/Riskli never share a match; saved coupons (CUSTOM, GENERATED) block their
  not-started matches everywhere, except selections with probability > `repeatAllowedAbove` (0.70).
- **7.2** Coupon generator at the top of Kuponlar: 3 modes (Hədəf — linked odds ⇄ probability; Aralıq — min odds + min
  probability; Real əmsal — min best-bookmaker odds + min probability), leg count chosen automatically, "Yadda saxla".
  Fərdi kupon builder stays unchanged (to be reworked later).

## Questions for the owner (block coding until answered)
1. Do you already have an `ODDS_API_KEY` (free tier)? Story 1.1 needs one call to `/v4/sports`.
2. Approve the ➕ schema additions (Template.status/settledAt, TemplateLeg.result, ApiCallLog)?
3. Greedy fills up to `maxLegs` (e.g. Sabit → 3 legs if possible). OK, or prefer `minLegs`?
4. Default `MAX_DISAGREEMENT` threshold — proposal **0.08** (8 percentage points).
5. Double chance will dominate Sabit (DC probabilities are naturally high). Keep DC in auto templates, or restrict it?
