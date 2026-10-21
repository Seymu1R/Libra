# Story 8.1 — Basketbol (NBA)

Status: review · Spec: [`../specs/8-1-basketball-nba.md`](../specs/8-1-basketball-nba.md) · Date: 2026-10-21

## Story
As the owner, I want NBA games with all available markets, kept apart from soccer so NBA never ends up in soccer coupons.

## Owner answers
- Separation: a **sport switch** (Futbol / Basketbol); every module works on one sport.
- Markets: "nəyi əlavə edə bilirsə" → winner, spread (fora), total points.
- Competitions: NBA only.

## Real data (sync 2026-10-21 17:01, 19 credits: 8 × 2 soccer + 3 NBA)
15 NBA games; winner 11–24 bookmakers. Bookmakers quote different spread / total lines (e.g. totals 239.5 × 7, 238.5 × 5),
so the main line (most bookmakers) is used: SPR in 11/15, TOT in 9/15 games with ≥ 8 bookmakers at one line.

## Acceptance criteria
1. `basketball_nba` in COMPETITIONS (sport basketball); odds request `markets=h2h,spreads,totals`; spreads stored.
2. Analysis: ML (2-way, incl. overtime), SPR and TOT at the main half-point line; whole lines and inconsistent spread pairs ignored;
   MIN_BOOKMAKERS as for soccer; no double chance.
3. Header switch Futbol / Basketbol (cookie `terezi-sport`); Matçlar, Kuponlar (generator, suggestions, builder, saved coupons) show one sport.
   Auto templates are built per sport; the server rejects a coupon mixing sports.
4. Labels: "Qalib: 1", "Fora: 1 -4.5", "Total xal: Üst 235.5" with descriptions; line saved on `TemplateLeg.line` (migration).
5. Mock fixtures for NBA (generated; soccer fixtures byte-identical); export includes spreads.

## Tasks
- [x] config: SPORTS, ODDS_MARKETS, sport on competitions, `sportOf`, `SPORT_COOKIE`
- [x] analysis: `moneylineBooks`, `mainLineBooks`, `analyzeBasketball`; `MarketAnalysis.line`; `Leg.line`
- [x] DB: `TemplateLeg.line` (migration `template_leg_line`); service: per-sport templates, mixed-sport guard, line in signature
- [x] UI: `SportSwitch`, `currentSport()`, MatchCard basketball columns, line-aware labels everywhere
- [x] fixtures: `scripts/generate-fixtures.ts` basketball section
- [x] Tests: +6 (95 total)
- [x] Real data + browser: Matçlar / Kuponlar on Basketbol, no soccer leaks, generator 3 × NBA winner, mobile dark
