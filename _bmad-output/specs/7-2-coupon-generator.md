# Spec 7.2 — Coupon generator

`generateCoupon(legs, goal, opts) → { ok: true, coupon } | { ok: false, error }` (pure, `lib/templates/generate.ts`)

Goals and acceptance window on coupon probability p (product of legs):
| mode | input | window | rank (lower = better) |
|---|---|---|---|
| target | probability P | p ∈ [P(1−tol), P(1+tol)], tol = `GENERATOR.targetTolerance` (0.05) | |ln(p/P)| |
| range | minOdds O, minProbability Y | p ∈ [Y, 1/O]; Y > 1/O → error "Şərtlər ziddiyyətlidir…" | |ln(p/√(Y/O))| |
| real | minRealOdds R, minProbability Y | p ≥ Y and Π bestOdds.price ≥ R; legs without bestOdds excluded | −p |

Candidates: disagreement ≤ `TEMPLATES.maxDisagreement`, probability ≥ `GENERATOR.minLegProbability` (0.2), `allowedDespiteBlock`.
For k = `minLegs`(2)…min(`maxLegs`(8), #matches): k = 2 exhaustive; else `pickFor(pool, k, target)` per target/pool.
First k with an accepted coupon wins (best rank). Legs returned sorted by `compareLegs`. `realOdds` = product of best prices or null.
UI: `CouponGenerator` (client). Save: `POST /api/templates/custom { syncId, type: "GENERATED", legs }`.
