# Spec 7.5 — Generator leg count

- `GeneratorGoal` target: `{ mode: "target"; probability; legs?: number }`. When set, `minLegs = maxLegs = legs`; must be an integer in `GENERATOR.minLegs…maxLegs`.
- Errors: "Matç sayı 2 ilə 8 arasında tam ədəd olmalıdır." · "Bu filtrdə yalnız N uyğun matç var — matç sayını azaldın." ·
  "N matçla bu hədəfə uyğun kupon tapılmadı — hədəfi və ya matç sayını dəyişin (boş buraxsanız sistem özü seçər)."
- Search (k ≥ 3): `pickFor(pool, k, target, preferValue, safeLegs)` for `safeLegs = 0…k−1` — first `safeLegs` most likely legs (one per match),
  the rest greedily at per-leg target `(log target − Σ log safe) / (k − safeLegs)`, then single-swap local search. Best by `rank` as before.
- UI: field `#gen-legs`, digits only (1 char), shown only in Hədəf mode; empty → `legs: undefined`.
