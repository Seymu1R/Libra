# The Odds API v4 — verified notes (Story 1.1)

Sources read 2026-10-20: https://the-odds-api.com/liveapi/guides/v4/ ,
https://the-odds-api.com/sports-odds-data/sports-apis.html ,
https://the-odds-api.com/sports-odds-data/betting-markets.html

Host: `https://api.the-odds-api.com`

## Endpoints we use

| Endpoint | Cost | Notes |
|---|---|---|
| `GET /v4/sports?apiKey=` | **free** | Array of `{ key, group, title, description, active, has_outrights }`. `all=true` also returns out-of-season. |
| `GET /v4/sports/{sport}/events?apiKey=&commenceTimeFrom=&commenceTimeTo=` | **free** | Array of `{ id, sport_key, sport_title, commence_time, home_team, away_team }`. Times ISO 8601, e.g. `2023-09-09T00:00:00Z`. |
| `GET /v4/sports/{sport}/odds?apiKey=&regions=eu&markets=h2h,totals&oddsFormat=decimal&commenceTimeFrom=&commenceTimeTo=` | **markets × regions = 2** | Array of events with `bookmakers[] { key, title, last_update, markets[] { key, last_update?, outcomes[] { name, price, point? } } }`. Bookmaker-level `last_update` is deprecated. `eventIds` also accepted. |
| `GET /v4/sports/{sport}/scores?daysFrom=1..3` | 2 with `daysFrom`, else 1 | Phase 2 only. `{ id, completed, scores: [{name, score}] | null, last_update }` (score is a **string**). |

## Headers (every response, including free endpoints)

- `x-requests-remaining` — credits left until quota reset
- `x-requests-used` — credits used since last reset
- `x-requests-last` — cost of the last call

## Errors

- `429` — rate limited; space requests out by several seconds. (401/422 bodies not documented on the guide page — handled generically: non-2xx → per-competition error with status + body text.)

## Sport keys (from the docs page — **still to be confirmed by a live `/v4/sports` call** once `ODDS_API_KEY` exists: `npm run verify:sports`)

| Competition | Key |
|---|---|
| EPL | `soccer_epl` |
| La Liga | `soccer_spain_la_liga` |
| Serie A | `soccer_italy_serie_a` |
| Bundesliga | `soccer_germany_bundesliga` |
| Ligue 1 | `soccer_france_ligue_one` |
| UEFA Champions League | `soccer_uefa_champs_league` |
| UEFA Europa League | `soccer_uefa_europa_league` |
| UEFA Conference League | `soccer_uefa_europa_conference_league` |

All 8 are listed in the official docs.

## Not documented — handled defensively (verify with first real response)

- Soccer `h2h` outcome names: docs say h2h "includes the draw for soccer" but do not show the literal. We map by `home_team` / `away_team` name equality and treat the third outcome named `Draw` as draw; any other name → bookmaker market dropped.
- `totals` outcome names `Over` / `Under` with `point` are shown only in prop examples. We accept only `point === 2.5`; a bookmaker may list several lines — we pick the 2.5 pair only.
- Docs note: "spreads and totals are mainly available for US sports and bookmakers at this time" → **risk**: O/U 2.5 may often have < `MIN_BOOKMAKERS` for EU soccer and be skipped. To be checked after the first real sync.
