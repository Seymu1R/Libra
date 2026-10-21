# Spec 7.7 — Balanced legs

- `legSpread(legs)` = variance of `log p` over the legs.
- Window gets `balanced` (true for target / range). Score of an accepted coupon: `balanced ? legSpread + 1e-6 · rank(p) : rank(p)`; lowest wins per leg count.
- Candidates per k ≥ 3: `pickEven(pool, k, target, lo, hi)` + the existing `pickFor` seeds. `pickEven`: one leg per match closest to `log target / k`,
  then single-swap local search on `1000 · distance outside [lo, hi] (log) + Σ (log p − mean)²`. k = 2 stays exhaustive (scored the same way).
