# Tərəzi — Agent Instructions

**Start every session with [`docs/HANDOFF.md`](docs/HANDOFF.md)** (current state, next steps), then read [`_bmad-output/project-context.md`](_bmad-output/project-context.md) before writing any code — it is the authoritative rules contract for this project.

**End every work session by:** (1) prepending an entry to [`docs/CHANGELOG.md`](docs/CHANGELOG.md), (2) updating `docs/HANDOFF.md`, `sprint-status.yaml`, `docs/decisions.md` / `docs/open-issues.md` as needed. The owner works across several computers — anything not written into the repo is lost.

Scope source of truth: [`ProjectDocs/original-brief.md`](ProjectDocs/original-brief.md) (verbatim owner brief — never edit).
Derived plans: [`prd.md`](_bmad-output/planning-artifacts/prd.md), [`architecture.md`](_bmad-output/planning-artifacts/architecture.md), [`epics.md`](_bmad-output/planning-artifacts/epics.md).
Progress: [`sprint-status.yaml`](_bmad-output/implementation-artifacts/sprint-status.yaml). Decisions/deviations: [`docs/decisions.md`](docs/decisions.md). Open issues: [`docs/open-issues.md`](docs/open-issues.md).

## Architecture

```
app/ (UI + thin route handlers)  →  server/ (Prisma, fetch, services)  →  lib/ (pure TS, tested)
```

Dependencies flow inward only. `lib/` never imports `next/*`, Prisma, or performs I/O.

## Guardrails (never regress)

1. Manual sync only — no polling, cron, live odds, or bet placement.
2. `ODDS_API_KEY` server-side only.
3. Dev/tests use `USE_MOCK_DATA=true` + `fixtures/` — never burn API credits.
4. All thresholds/competition keys in `lib/config.ts`.
5. UI in Azerbaijani, times in Asia/Baku.

## Workflow

- BMAD project: each story = story file (`_bmad-output/implementation-artifacts/`) + spec (`_bmad-output/specs/`).
- Communicate with the owner in Azerbaijani.
- **Never commit or push without an explicit request.**
