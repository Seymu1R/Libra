---
project: Tərəzi
derived_from: ProjectDocs/original-brief.md
status: draft — awaiting owner approval
date: 2026-10-20
---

# PRD — Tərəzi

Personal, local web app: pulls **pre-match** football odds from many bookmakers (The Odds API v4),
computes the market's **vig-free consensus probabilities**, and builds **view-only coupon templates**.
It never places bets, has no in-play features, and is single-user.

## Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | Verify sport keys for 8 competitions via `GET /v4/sports` (free). Unavailable ones are reported, never invented. |
| FR-2 | Fetch odds: `regions=eu`, `markets=h2h,totals`, `oddsFormat=decimal`. Prefer the free events endpoint to avoid spending credits. |
| FR-3 | Log `x-requests-remaining/used/last` on every API call; persist latest remaining. |
| FR-4 | Manual sync only (`POST /api/sync`, button "Sinxron et"). No polling, no cron. |
| FR-5 | Competition selection per sync (default: all). |
| FR-6 | Only matches in the next `SYNC_DAYS_AHEAD` days (default 7) and not started. |
| FR-7 | Cooldown `SYNC_COOLDOWN_MINUTES` (default 30) between syncs with a visible message. |
| FR-8 | Per-competition failure isolation + per-competition status recorded on the `Sync`. |
| FR-9 | Every sync is a stored snapshot; analysis/filters never call the API. |
| FR-10 | Per-bookmaker margin removal (normalize 1/odds per market). |
| FR-11 | Markets: 1X2, Over/Under **2.5 only**, Double Chance **derived** from 1X2 consensus. ➕ 2026-10-21 (Story 7.6): also 3.5 / 4.5, one line per match. |
| FR-12 | Consensus = **median** of per-bookmaker fair probabilities, then renormalized. |
| FR-13 | Disagreement = max − min of per-bookmaker fair probabilities. |
| FR-14 | Skip below `MIN_BOOKMAKERS` (default 8). |
| FR-15 | Best available odds per selection + which bookmaker. |
| FR-16 | Templates: ≤1 leg per match, disagreement filter, product of probabilities (independence assumption shown), fair odds = 1/p. |
| FR-17 | Template types Sabit (2–3, ≥70%), Balanslı (3–4, ≥60%), Riskli (4–6, ≥50%); deterministic greedy selection. |
| FR-18 | Custom template: manual leg picking, live combined probability + fair odds. |
| FR-19 | UI in Azerbaijani; all times Asia/Baku. Header: sync button, last sync, credits, cooldown. |
| FR-20 | Matches view grouped by competition; Templates view as cards; "market estimate, not a guarantee" note. |

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | `ODDS_API_KEY` server-side only — never in a client bundle or API response. |
| NFR-2 | Analysis library is pure TS in `lib/`, zero Next.js/Prisma imports, fully unit tested (Vitest). |
| NFR-3 | All thresholds + competition keys live in `lib/config.ts`. |
| NFR-4 | `USE_MOCK_DATA` flag + JSON fixtures — development never burns credits. |
| NFR-5 | Prisma + SQLite, portable to PostgreSQL (no SQLite-only features). |
| NFR-6 | API response shapes validated at runtime (zod); unknown shapes fail loudly, not silently. |
| NFR-7 | README in Azerbaijani. |

## Phase 2 (out of scope now; schema must be ready)

Final scores → settle templates won/lost → calibration view (do ~X% templates hit ~X%?).

## Out of scope

Bet placement, live/in-play odds, multi-user/auth, scheduled syncing, hosting.
