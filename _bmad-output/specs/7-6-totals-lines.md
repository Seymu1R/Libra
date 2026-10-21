# Spec 7.6 — Totals lines

- `TOTALS_LINES = { OU25: 2.5, OU35: 3.5, OU45: 4.5 }`; `Market = "1X2" | "DC" | TotalsMarket`; each OU market has selections OVER/UNDER.
- `AnalysisOptions.totalsMarkets` (from `ANALYSIS.totalsMarkets`, order = preference): for each, `totalsBooks(prices, line)` → fair → keep the one with
  the largest valid bookmaker count ≥ `minBookmakers` (strictly larger wins, so ties keep the earlier line).
- Labels: `selectionLabel(market, sel)` ("Üst <line>" / "Alt <line>", others unchanged); `describeSelection(market, sel, home, away)`.
- Leg ordering: all OU markets share rank 1 in `MARKET_ORDER`. Market strings are stored as-is in `TemplateLeg.market`; no migration.
