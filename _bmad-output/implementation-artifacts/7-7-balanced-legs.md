# Story 7.7 — Generator: riskin bərabər paylanması

Status: review · Spec: [`../specs/7-7-balanced-legs.md`](../specs/7-7-balanced-legs.md) · Date: 2026-10-21

## Story
As the owner, I want the generator to spread the risk evenly across legs (e.g. 8 × ~69% for 5%), not mix ~90% legs with ~50% legs.

## Acceptance criteria
1. Hədəf and Aralıq: among coupons that meet the goal (same window as before), the one with the most even leg probabilities wins
   (lowest variance of log-probabilities); closeness to the target only breaks ties.
2. Real əmsal mode unchanged (it maximises probability above the real-odds minimum).
3. Leg-count rule unchanged (fixed count, or fewest legs when empty).

## Tasks
- [x] `lib/templates/generate.ts`: `legSpread`, `pickEven` (start at target^(1/k) per leg, swap into the window keeping legs close), `balanced` window flag
- [x] UI hints mention the even split
- [x] Test: +1 (86 total)
- [x] Real data, 24 saat, 5% × 8: legs 57–87% (was 50–92%, as in the owner's screenshot); 2–6 ms per generation
