# Spec 8.1 — Basketball (NBA)

- `COMPETITIONS[].sport`; `SPORTS = soccer | basketball`; `ODDS_MARKETS = { soccer: "h2h,totals", basketball: "h2h,spreads,totals" }`.
- Markets: `ML` (HOME/AWAY), `SPR` (HOME/AWAY, `line` = home handicap, away = −line), `TOT` (OVER/UNDER, `line` = points).
- `mainLineBooks(rows, kind, home, away)`: per bookmaker exactly one half-point line (spreads: home point h, away point −h);
  group by line, keep the group with most complete bookmakers, ties → lower line.
- `analyzeMatch` → `analyzeBasketball` for basketball competitions; skipped when ML has < MIN_BOOKMAKERS; SPR/TOT need ≥ MIN_BOOKMAKERS at their line.
- Sport filter: cookie `terezi-sport` (`parseSport`, default soccer), read by `app/current-sport.ts`; pages filter analyses and saved coupons by `sportOf(competition)`.
- `regenerateTemplates`: `buildAutoTemplates` per sport. `saveCustomTemplate`: error "Futbol və basketbol eyni kuponda ola bilməz." when sports mix.
- `couponSignature` includes `line`. Labels: `selectionLabel(market, sel, line)`, `describeSelection(market, sel, home, away, line)`.
