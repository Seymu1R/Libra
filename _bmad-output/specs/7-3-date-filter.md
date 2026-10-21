# Spec 7.3 — Date filter

`lib/date-filter.ts` (pure):
- `type DateFilter = {kind:"24h"} | {kind:"week"} | {kind:"all"} | {kind:"day",date} | {kind:"range",from,to}` (days "YYYY-MM-DD", Baku)
- `parseDateFilter(searchParams)` — `filtr` ∈ 24saat|hefte|umumi|tarix|araliq; `tarix`, `bas`, `son`; invalid → `{kind:"24h"}`; real calendar days only; range swapped if reversed
- `toSearchParams(f)` — inverse of parse
- `dateWindow(f, now) → {from, to|null}` (to exclusive): 24h [now, now+24h) · week [now, now+7d) · all [now, ∞) · day [d 00:00+04, +1d) · range [from 00:00+04, to+1d)
- `inWindow(commenceTime, w)`, `dayStart(day)`, `bakuDay(instant)` — offset `DISPLAY.utcOffset` (+04:00, no DST)

Page: `analyses.filter(inWindow)` → `allLegs` (generator + builder) and `buildAutoTemplates(filtered, blocked, now)` (suggestions).
Date inputs: min = today (Baku), max = today + `SYNC.daysAhead`.
