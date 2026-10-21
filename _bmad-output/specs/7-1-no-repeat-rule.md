# Spec 7.1 — No-repeat rule

- `allowedDespiteBlock(leg, blocked, t) = !blocked.has(leg.matchId) || leg.probability > t` (strict).
- `buildTemplate(analyses, rule, opts, exclude)` — eligible legs additionally require `!exclude.has(matchId)` and `allowedDespiteBlock`.
- `buildTemplates` threads a `used` set through the rules in order; each built template adds its matches.
- `blockedMatchIds(db, now)` = distinct `TemplateLeg.matchId` where template.type ∈ SAVED_TEMPLATE_TYPES, status = PENDING, match.commenceTime > now.
- `saveCustomTemplate(db, syncId, picks, now, type)`: probabilities recomputed server-side; for `GENERATED` each leg must pass `allowedDespiteBlock`
  (error: "<home> — <away> artıq saxlanmış kupondadır."); afterwards `regenerateTemplates(syncId)`.
- `listTemplates(db, syncId)` = templates of the sync ∪ all saved templates.
- `regenerateTemplates` deletes only non-saved templates of the sync.
- Thresholds live in `lib/config.ts` (guardrail 4).
