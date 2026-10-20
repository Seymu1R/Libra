# Decisions Log

Record every decision or deviation from `ProjectDocs/original-brief.md` here (date, decision, why, approved by).

| Date | Decision | Why | Approved |
|---|---|---|---|
| 2026-10-20 | Reuse BMAD/WDS tooling structure from AviDelux-Latest-Platform (`_bmad/`, `.claude/skills`, `.agents/skills`, `_bmad-output/`) | Keep planning, stories and context persistent across sessions | owner |
| 2026-10-20 | Template greedy fills up to `maxLegs`; `MAX_DISAGREEMENT = 0.08`; DC kept in auto templates | Owner answers to plan questions | owner |
| 2026-10-20 | Schema additions: `Template.status/settledAt`, `TemplateLeg.result`, `ApiCallLog`, `Sync.mock`, `OddsSnapshot.bookmakerTitle` | Phase 2 readiness; quota logging on every call; separate mock cooldown; bookmaker display names | owner ("başla") |
| 2026-10-20 | Prisma 7.10 (stable) instead of 8.0 RC; TypeScript 5.9 instead of 7.0 | Avoid release candidates / tooling incompatibilities | agent |
| 2026-10-20 | Sport keys taken from official docs; live verification deferred until API key exists | Owner has no key yet | owner |
| 2026-10-20 | Custom templates can be saved (type CUSTOM) | Useful for Phase 2 calibration | agent |
