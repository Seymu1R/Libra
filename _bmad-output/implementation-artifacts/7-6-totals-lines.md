# Story 7.6 — Üst/Alt 3.5 və 4.5 xətləri

Status: review · Spec: [`../specs/7-6-totals-lines.md`](../specs/7-6-totals-lines.md) · Date: 2026-10-21

## Story
As the owner, I want over/under selections for matches whose bookmakers quote 3.5 or 4.5 instead of 2.5, so more matches have that market.

## Context
Checked on the real sync (no credits): every bookmaker quotes exactly one main totals line per match. 2.5 → 60/97 matches with ≥ 8 bookmakers,
3.5 → 23, 4.5 → 2, Asian lines (2.25, 3.0, …) ≤ 3 bookmakers. No 1.5 line in the data. Owner: keep 2.5, add 3.5 and 4.5 ("bəli əlavə et").

## Acceptance criteria
1. Markets `OU25 | OU35 | OU45`; per match at most one — the line with the most valid bookmakers (≥ MIN_BOOKMAKERS), ties → 2.5 first.
2. 2.5 behaves as before; Asian/other lines are ignored. Lines are configured in `ANALYSIS.totalsMarkets`.
3. Labels follow the line: "Üst/Alt 3.5", "Üst 3.5", "3.5-dən çox qol" — Matçlar, generator, suggestions, custom builder, saved coupons.
4. Coupons (generator, suggestions, custom) can use the new markets; saved coupons with OU25 keep working.

## Tasks
- [x] `lib/analysis/types.ts` `TOTALS_LINES`, `TotalsMarket`; `analyze.ts` best-covered line; `config.ts` `totalsMarkets`
- [x] `lib/labels.ts` `selectionLabel(market, selection)`, `describeSelection(market, …)`; components updated; MatchCard "Üst/Alt" column
- [x] Tests: +3 analyze, +2 labels (85 total)
- [x] Real data: OU25 60 · OU35 23 · OU45 2 → 85/97 matches with over/under (was 60); browser check of Matçlar + Kuponlar
