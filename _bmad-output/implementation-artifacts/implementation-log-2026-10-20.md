# Implementation log — 2026-10-20 (Epics 0–5)

Owner answers (2026-10-20): no API key yet (start anyway, explain how to add later) · greedy fills to `maxLegs` ·
`MAX_DISAGREEMENT = 0.08` · keep double chance in auto templates · "başla" → schema additions accepted.

## Delivered
- Scaffold: Next.js 16.4 (App Router), React 19.3, TS 5.9 strict, Tailwind 4, Vitest 5, Prisma 7.10 (SQLite via better-sqlite3 adapter), zod 4.
- Story 1.1: official docs read → `ProjectDocs/APIDocs/the-odds-api-v4.md`; all 8 keys listed in docs. Live check = `npm run verify:sports` (needs key).
- `lib/` pure analysis + templates, `server/` services, routes `POST /api/sync`, `GET /api/status`, `POST /api/templates`, `POST|DELETE /api/templates/custom`.
- Mock mode with deterministic fixtures (`scripts/generate-fixtures.ts`) incl. edge cases: <8 bookmakers, missing totals, incomplete 1X2, extra 3.5 line, high disagreement, started match, match beyond 7 days.
- 52 unit/service tests green; `tsc`, `eslint`, `next build` clean; E2E smoke against prod build in mock mode; screenshots checked (desktop + 390px).

## Notable decisions
- Date/number formatting is hand-assembled (not `Intl` az-AZ) — az locale data differs between Node and Chrome → hydration mismatch.
- Mock and real syncs have separate cooldowns; mock cooldown 0.
- Custom template save recomputes probabilities server-side from the snapshot.
- Stale `running` sync (>10 min) no longer blocks.

## Known observations
- With greedy + DC + maxLegs, the three auto templates are nested (Riskli ⊇ Balanslı ⊇ Sabit) and mostly DC — see docs/open-issues.md.
