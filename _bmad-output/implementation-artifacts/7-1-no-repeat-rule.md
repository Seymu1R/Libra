# Story 7.1 — Təkrar qaydası (no-repeat rule)

Status: review · Spec: [`../specs/7-1-no-repeat-rule.md`](../specs/7-1-no-repeat-rule.md) · Date: 2026-10-21

## Story
As the owner, I want coupons not to share matches, so that one failed match does not sink several coupons at once.

## Acceptance criteria
1. Auto templates are built in order Sabit → Balanslı → Riskli; a match used by one is never used by a later one (no exception).
2. Matches (not yet started) in pending saved coupons (`CUSTOM`, `GENERATED`) are blocked for auto templates and the generator.
3. A blocked match may be used again only with a selection whose probability is strictly above `TEMPLATES.repeatAllowedAbove` (0.70).
4. Saving or deleting a saved coupon rebuilds the auto templates of the current sync.
5. Saved coupons stay listed after new syncs.
6. Server rejects a `GENERATED` save that breaks rule 3. The manual "Fərdi kupon" builder is not restricted (owner: keep as is).

## Tasks
- [x] `lib/config.ts`: `repeatAllowedAbove`, `SAVED_TEMPLATE_TYPES`
- [x] `lib/templates/build.ts`: `allowedDespiteBlock`, `exclude` param, sequential `buildTemplates`
- [x] `server/templates.service.ts`: `blockedMatchIds`, regenerate with blocked set, save type + validation, list across syncs, delete → regenerate
- [x] `app/api/templates/custom/route.ts`: `type` field; DELETE rebuilds auto templates
- [x] Tests: `build.test.ts` (+3), `sync.service.test.ts` (+2)

## Dev notes
Owner decision 2026-10-21: the > 70% exception applies only against saved coupons — with it inside auto templates they would
overlap exactly as before (verified on fixtures). Test data result: Sabit 77,2% · Balanslı 60,1% · Riskli 25,0%, no shared matches.
