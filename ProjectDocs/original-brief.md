# Original Brief (verbatim — do not edit)

> Source of truth for the product scope as given by the owner on 2026-10-20.
> PRD / architecture / epics in `_bmad-output/planning-artifacts/` are derived from this file.
> If they ever disagree, this file wins unless the owner approved a change (log it in `docs/decisions.md`).

# Build "Tərəzi" — a personal football odds-consensus analysis web app

## Goal
A local, personal web app that pulls pre-match odds from multiple bookmakers,
computes the market's consensus (vig-free) probabilities, and generates
coupon *templates* for viewing only. The app never places bets and has no
live/in-play features. The user plays elsewhere if they choose.

## Stack
- Next.js (App Router, TypeScript), no separate backend
- Prisma + SQLite (keep it easy to switch to PostgreSQL later)
- Tailwind CSS for UI
- Vitest for unit tests
- UI language: Azerbaijani. All times displayed in Asia/Baku timezone.

## Data source: The Odds API v4
- API key from env var `ODDS_API_KEY` (server-side only, never sent to client). Provide `.env.example`.
- Do NOT guess response shapes or sport keys. First, read the official docs
  and call the free `/v4/sports` endpoint to confirm the sport keys for:
  EPL, La Liga, Serie A, Bundesliga, Ligue 1, UEFA Champions League,
  UEFA Europa League, UEFA Conference League.
  If a competition is not available, report it to me instead of inventing a key.
- Odds request: `regions=eu`, `markets=h2h,totals`, `oddsFormat=decimal`.
- Use the free events endpoint where possible to avoid spending quota.
- Read and log `x-requests-remaining`, `x-requests-used`, `x-requests-last`
  headers on every call; persist the latest remaining value.

## Sync flow (manual only — no polling, no cron)
- A "Sinxron et" button triggers `POST /api/sync`.
- User can choose which competitions to sync (default: all).
- Only fetch matches starting within the next N days (config, default 7)
  and not yet started.
- Cooldown: block a new sync within X minutes of the last one (config, default 30) and show a message.
- If one competition fails, continue with the others; record per-competition status.
- Save every sync as a snapshot; analysis always runs on stored data, so
  re-running analysis or changing filters must NOT call the API again.

## Data model (Prisma)
- `Sync`: id, startedAt, finishedAt, status, creditsUsed, creditsRemaining, per-competition results (JSON)
- `Match`: id (API event id), competition, homeTeam, awayTeam, commenceTime,
  homeScore?, awayScore?, completed (for a later phase)
- `OddsSnapshot`: syncId, matchId, bookmaker, market, outcome, point?, price
- `Template`: id, createdAt, syncId, type, combinedProbability, fairOdds
- `TemplateLeg`: templateId, matchId, market, selection, probability, bookmakerCount

## Analysis (pure TypeScript in `lib/`, no Next.js imports, fully unit tested)
1. Per bookmaker, convert odds to implied probabilities (1/odds) and remove
   the margin by normalizing so outcomes sum to 1. Do this per market.
2. Markets:
   - 1X2 (h2h): home / draw / away
   - Over/Under 2.5 only (ignore other total lines)
   - Double chance (1X, X2, 12): DERIVED from the 1X2 consensus, not fetched
3. Consensus probability = MEDIAN of per-bookmaker fair probabilities
   (not mean — many bookmakers share the same odds feed). Renormalize after taking medians.
4. Disagreement = max − min of per-bookmaker fair probabilities.
5. Skip matches with fewer than MIN_BOOKMAKERS (config, default 8).
6. Also show the best available odds per selection and which bookmaker offers it.

## Coupon templates
- One selection per match maximum (selections from the same match are correlated).
- Exclude selections whose disagreement exceeds a configurable threshold.
- Combined probability = product of leg probabilities (state clearly in the UI
  that this assumes independence). Fair coupon odds = 1 / combined probability.
- Three default template types (all thresholds configurable in one config file):
  - Sabit: 2–3 legs, each ≥ 70%
  - Balanslı: 3–4 legs, each ≥ 60%
  - Riskli: 4–6 legs, each ≥ 50%
- Deterministic selection (e.g., greedy by probability, tie-break by lower disagreement).
- Also allow a custom template: user picks legs manually and sees combined
  probability and fair odds live.

## UI (Azerbaijani)
- Header: sync button, last sync time, remaining API credits, cooldown state.
- Matches view grouped by competition: kickoff time, consensus probabilities
  per market, bookmaker count, disagreement, best odds.
- Templates view: cards with legs, each leg's probability, combined probability
  (as %), fair coupon odds.
- A clear note: probabilities are the market's estimate, not a guarantee.

## Engineering requirements
- Start with a plan and wait for my approval before writing code.
- Build in phases: (1) API client + sport key verification, (2) DB schema +
  sync, (3) analysis library with tests, (4) templates, (5) UI.
- Create mock odds JSON fixtures for tests and local development so
  development does not burn API credits. Add a `USE_MOCK_DATA` env flag.
- Keep all thresholds and competition keys in `lib/config.ts`.
- Write a short README (in Azerbaijani) with setup and run instructions.

## Phase 2 (not now, but keep the schema ready)
- Fetch final scores, mark templates as won/lost, and show calibration:
  do templates with ~X% probability actually hit ~X% of the time?
