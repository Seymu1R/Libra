# Story 7.5 — Generator: matç sayı (Hədəf rejimi)

Status: review · Spec: [`../specs/7-5-generator-leg-count.md`](../specs/7-5-generator-leg-count.md) · Date: 2026-10-21

## Story
As the owner, I want to set the number of matches in the generator's "Hədəf" mode, together with odds / probability.

## Acceptance criteria
1. "Hədəf" mode has a third, optional field "Matç sayı (2–8)" next to Əmsal ⇄ Ümumi ehtimal; empty = "Avto" (fewest legs, as before).
2. With a count, the coupon has exactly that many matches and hits the target probability (±5%) — odds + count and probability + count work
   the same way, because odds and probability stay linked.
3. Clear errors: count outside 2–8; fewer eligible matches than the count ("Bu filtrdə yalnız N uyğun matç var…"); no coupon with N matches.
4. Aralıq / Real əmsal unchanged (owner: "hələlik hədəfə").

## Tasks
- [x] `lib/templates/generate.ts`: `legs?` on the target goal; multi-seed search (seed with 0…k−1 most likely legs) so fixed counts don't miss feasible coupons
- [x] `components/CouponGenerator.tsx`: "Matç sayı" field (digits only, placeholder "Avto")
- [x] Tests: +2 (81 total)
- [x] Headless Chrome on real data (no DB writes): 2,50×2/4, 5,00×6, 10,00×3 → exact counts; 1,20×8 → error; light/dark/mobile
