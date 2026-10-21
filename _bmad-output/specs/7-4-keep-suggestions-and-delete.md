# Spec 7.4 — Keep suggestions, duplicate guard, delete

- `SAVED_TEMPLATE_TYPES = CUSTOM | GENERATED | SAVED_SABIT | SAVED_BALANSLI | SAVED_RISKLI`; `savedTypeFor(rule) = "SAVED_" + rule`.
- `couponSignature(legs)` = sorted `matchId|market|selection` joined by `;`.
- `saveCustomTemplate`: reject when a PENDING saved template has the same signature; repeat rule (`allowedDespiteBlock`) for every type except CUSTOM; then `regenerateTemplates`.
- UI: suggestion card action = "Yadda saxla" (POST `/api/templates/custom` with `type: savedTypeFor(type)`) or "✓ Saxlanılıb" when its signature is saved.
  Saved card action = `DeleteButton` (two-step, Esc cancels, focus to cancel) → DELETE `/api/templates/custom?id=`.
