# Story 7.2 — Kupon generatoru

Status: review · Spec: [`../specs/7-2-coupon-generator.md`](../specs/7-2-coupon-generator.md) · Date: 2026-10-21

## Story
As the owner, I want to enter a target odds / probability and get a coupon built for me, then save it.

## Acceptance criteria
1. Generator section is the first block on `/templates`, above "Sistemin təklifləri", "Fərdi kupon", "Saxlanmış kuponlar".
2. Three modes: **Hədəf** (odds and probability inputs linked: odds = 1 / probability), **Aralıq** (fair odds ≥ X and probability ≥ Y;
   contradictory input explained), **Real əmsal** (product of best bookmaker prices ≥ X and probability ≥ Y; no double chance).
3. Leg count chosen automatically: fewest legs in [2, 8] that satisfy the goal; one leg per match; disagreement filter applies.
4. Repeat rule from 7.1 applies; "Yadda saxla" stores the coupon as `GENERATED`; result card shows legs, count, probability, fair odds, real odds.
5. Deterministic; inputs accept comma or dot decimals; Azerbaijani UI, works in light and dark mode.

## Tasks
- [x] `lib/templates/generate.ts` (`generateCoupon`, `realOdds`) + `lib/format.ts` `parseDecimal`
- [x] `lib/config.ts` `GENERATOR`
- [x] `components/CouponGenerator.tsx`; `TemplatesView` / `app/templates/page.tsx` wiring (`blockedMatchIds` prop); label `GENERATED: "Generator"`
- [x] Tests: `generate.test.ts` (12), `format.test.ts` (+1)
- [x] Headless Chrome check: all modes, save → next coupon avoids saved matches, contradictory range message, light/dark/mobile

## Dev notes
Runs client-side on legs the page already has (no API call, no odds-API credits); the save route re-validates.
Search: k = 2 exhaustive over pairs; k ≥ 3 greedy-by-per-leg-target + single-swap local search; Real mode also tries pools of
highest-value legs (best price × probability). ~40 ms on 1 100 legs.
Known trait: "fewest legs" means low targets are reached with few low-probability legs (min leg probability 20%).
