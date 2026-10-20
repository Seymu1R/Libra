---
project_name: 'Tərəzi'
user_name: 'Seymur'
date: '2026-10-20'
status: 'draft'
optimized_for_llm: true
---

# Project Context for AI Agents

Critical rules every agent MUST follow when implementing code in Tərəzi.

## Technology Stack

| Component | Technology |
|---|---|
| Framework | Next.js (App Router), TypeScript strict |
| DB | Prisma + SQLite (must stay PostgreSQL-portable) |
| UI | Tailwind CSS, Azerbaijani labels, Asia/Baku time |
| Tests | Vitest |
| Validation | zod (all external API responses) |
| Data source | The Odds API v4 |

## Non-negotiable guardrails

1. **No betting, no live.** The app never places bets, has no in-play features, no polling/cron. Sync is manual only.
2. **Secret hygiene.** `ODDS_API_KEY` is read only in `server/odds-client.ts` (`import 'server-only'`). Never expose it to client components, API responses, logs, or fixtures.
3. **Credits are precious.** Never call the paid odds endpoint from tests or during development — use `USE_MOCK_DATA=true` and `fixtures/`. Analysis and filters always run on stored snapshots.
4. **Never guess API shapes or sport keys.** Confirm against official docs / real `/v4/sports` output; parse with zod.
5. **`lib/` is pure.** No `next/*`, no `@prisma/client`, no `fetch`, no `Date.now()` inside analysis functions (pass `now` in). Fully unit tested.
6. **Single config.** Every threshold and competition key lives in `lib/config.ts`. No magic numbers elsewhere.
7. **Determinism.** Template generation and best-odds tie-breaks must be deterministic.
8. **Probabilities are 0–1 floats internally;** convert to % only at the UI edge.
9. **Times** stored UTC (ISO / `DateTime`), displayed via `lib/time.ts` in `Asia/Baku`.

## Conventions

- Components: PascalCase `.tsx`; modules: kebab-case `.ts`; constants `UPPER_SNAKE_CASE`.
- Tests colocated as `*.test.ts`.
- Route handlers stay thin — logic lives in `server/*.service.ts`.
- User-facing strings in Azerbaijani; code, identifiers, comments, commit messages in English.

## Workflow

- BMAD: story file in `_bmad-output/implementation-artifacts/`, spec in `_bmad-output/specs/`; update `sprint-status.yaml`.
- Decisions and deviations from the brief go to `docs/decisions.md`.
- Never commit or push without an explicit request.
