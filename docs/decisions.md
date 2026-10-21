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
| 2026-10-21 | UI design system from ui-ux-pro-max skill: semantic CSS tokens, blue primary (replaces emerald accent), Fira Sans/Fira Code, class-based dark mode with Light/Dark/System toggle | Owner asked to fix UI per skill with day + night modes | owner |
| 2026-10-21 | Open issue #5 resolved: auto templates (Sabit → Balanslı → Riskli) never share a match | Owner chose "no repeat" after comparing variants (a) ranges / (b) no repeat / (c) DC only in Sabit on test data | owner |
| 2026-10-21 | Saved coupons (CUSTOM, GENERATED) block their not-started matches for auto templates and the generator; exception: selections with probability > 70% (`repeatAllowedAbove`). The exception does NOT apply between auto templates | Owner: one failed match must not sink other coupons; with the exception inside auto templates they would overlap exactly as before | owner |
| 2026-10-21 | Coupon generator with 3 modes (Hədəf linked odds⇄probability / Aralıq / Real əmsal), automatic leg count (fewest legs 2–8), saved as type GENERATED | Owner request; chose "all 3 modes" and "automatic" | owner |
| 2026-10-21 | Manual "Fərdi kupon" builder kept unchanged (not restricted by the repeat rule), but its saved coupons do block matches | Owner: keep it as the third module, rework later | owner |
| 2026-10-21 | Saved coupons are listed across syncs (previously only the sync they were made in) | Needed for the repeat rule to make sense after a new sync | agent |
| 2026-10-21 | Dev/start port fixed to 4019 (`-p 4019`) | Owner: never clash with other local projects (3000 is taken by rifah-api-gateway) | owner |
| 2026-10-21 | Kuponlar date filter: 24 saat (default, now+24h) · Bu həftə (now+7 days) · Ümumi (all, as before) · Tarix (one Baku day) · Aralıq (Baku days); one filter on top for generator + suggestions + builder; kept in URL | Owner request and answers | owner |
| 2026-10-21 | System suggestions are now computed live per filter on page load; "Yenidən hesabla" button removed (stored auto templates are still rebuilt on sync/save/delete) | Suggestions must follow the filter; the button had no visible effect anymore | agent |
| 2026-10-21 | System suggestions can be saved (types SAVED_SABIT/BALANSLI/RISKLI); identical coupons cannot be saved twice | Owner request; Sabit legs are > 70% so the suggestion stays the same after saving — without the guard it could be saved repeatedly | owner / agent |
| 2026-10-21 | Generator "Hədəf" mode takes an optional match count (2–8); empty keeps the automatic fewest-legs choice. Other modes unchanged for now | Owner request ("hələlik hədəfə") | owner |
| 2026-10-21 | Over/under: 3.5 and 4.5 analysed besides 2.5; one line per match (most bookmakers, ties → 2.5). Deviation from FR-11 "2.5 only" | Real data: bookmakers quote one main line per match, so 25 matches had no over/under at all; no extra credits. Owner approved | owner |
| 2026-10-21 | Generator (Hədəf / Aralıq) prefers the most even legs among coupons that meet the goal | Owner: spread the risk evenly. Note: the coupon probability is the same either way; even legs keep estimation error a bit lower | owner |
| 2026-10-21 | Data export via `exceljs` 4.4.0 (server-only). `npm audit` reports a moderate advisory for its `uuid@8` dependency (only affects `uuid` calls with a caller-supplied buffer, which exceljs does not expose to us) | Owner wants Excel + CSV; hand-writing xlsx (zip + XML) is more risk than a well-known library | owner / agent |
| 2026-10-21 | Export covers all syncs for raw odds, but probabilities only for the latest sync (they are computed, not stored) | Keeps the file meaningful; older syncs can be re-analysed if needed | agent |
| 2026-10-21 | Delete = visible danger button + in-card confirmation (no browser confirm dialog) | Owner: delete more visible, per UI/UX rules (destructive action needs confirmation) | owner |
