# Story 7.4 — Sistemin təkliflərini saxlamaq + görünən silmə

Status: review · Spec: [`../specs/7-4-keep-suggestions-and-delete.md`](../specs/7-4-keep-suggestions-and-delete.md) · Date: 2026-10-21

## Story
As the owner, I want to keep a system suggestion (Sabit / Balanslı / Riskli) and to delete saved coupons easily but safely.

## Acceptance criteria
1. Each system suggestion card has "Yadda saxla"; it saves as `SAVED_SABIT|SAVED_BALANSLI|SAVED_RISKLI` (label "Sistem · …"), follows the repeat rule.
2. The same coupon (same selections, any order) cannot be saved twice — server error "Bu kupon artıq yadda saxlanılıb."; a suggestion
   identical to a saved coupon shows "✓ Saxlanılıb" instead of the button (Sabit legs are > 70%, so Sabit stays the same after saving).
3. Saved coupon cards have a visible "Sil" button (danger outline, trash icon, 36 px high) with in-card confirmation
   "Silinsin? Bəli, sil / Ləğv et" — no browser dialog; focus moves to "Ləğv et"; Esc cancels.
4. Save/delete show a status message; suggestions refresh.

## Tasks
- [x] `lib/config.ts` saved types + `savedTypeFor`; `lib/labels.ts`; `--on-danger` token
- [x] `lib/templates/build.ts` `couponSignature`; `server/templates.service.ts` duplicate guard, repeat rule for all but CUSTOM
- [x] `components/TemplatesView.tsx` keep action, `DeleteButton`, card `action` slot, notice
- [x] Tests: +2 service tests (79 total)
- [x] Headless Chrome on a copy of the real DB (restored afterwards): save → "Saxlanılıb", confirm/Esc/delete, light + dark
