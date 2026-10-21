// Generates deterministic mock fixtures in The Odds API v4 response shape.
// Times are relative to FIXTURE_ANCHOR; the mock client shifts them to "now" at read time.
// Run: npx tsx scripts/generate-fixtures.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { COMPETITIONS } from "../lib/config";
import { FIXTURE_ANCHOR } from "../lib/fixtures-anchor";

let seed = 20261020;
function rand(): number {
  // mulberry32 — deterministic
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (a: number, b: number) => a + (b - a) * rand();
const round2 = (n: number) => Math.round(n * 100) / 100;

const BOOKMAKERS: [string, string][] = [
  ["pinnacle", "Pinnacle"],
  ["betfair_ex_eu", "Betfair"],
  ["unibet_eu", "Unibet"],
  ["williamhill", "William Hill"],
  ["marathonbet", "Marathon Bet"],
  ["onexbet", "1xBet"],
  ["sport888", "888sport"],
  ["betclic", "Betclic"],
  ["betsson", "Betsson"],
  ["nordicbet", "NordicBet"],
  ["matchbook", "Matchbook"],
  ["coolbet", "Coolbet"],
  ["everygame", "Everygame"],
  ["tipico_de", "Tipico"],
];

const TEAMS: Record<string, string[]> = {
  soccer_epl: [
    "Arsenal",
    "Chelsea",
    "Liverpool",
    "Manchester City",
    "Tottenham Hotspur",
    "Newcastle United",
    "Aston Villa",
    "Brighton and Hove Albion",
    "Everton",
    "Fulham",
  ],
  soccer_spain_la_liga: [
    "Real Madrid",
    "Barcelona",
    "Atlético Madrid",
    "Sevilla",
    "Real Sociedad",
    "Villarreal",
    "Real Betis",
    "Athletic Bilbao",
  ],
  soccer_italy_serie_a: ["Inter Milan", "AC Milan", "Juventus", "Napoli", "AS Roma", "Lazio", "Atalanta BC", "Fiorentina"],
  soccer_germany_bundesliga: [
    "Bayern Munich",
    "Borussia Dortmund",
    "RB Leipzig",
    "Bayer Leverkusen",
    "VfB Stuttgart",
    "Eintracht Frankfurt",
    "SC Freiburg",
    "VfL Wolfsburg",
  ],
  soccer_france_ligue_one: ["Paris Saint Germain", "Marseille", "Lyon", "Monaco", "Lille", "Nice", "Lens", "Rennes"],
  soccer_uefa_champs_league: ["Real Madrid", "Manchester City", "Bayern Munich", "Qarabağ FK", "Inter Milan", "Benfica", "Porto", "Celtic"],
  soccer_uefa_europa_league: ["Ajax", "Roma", "Tottenham Hotspur", "Lyon", "Fenerbahce", "Rangers", "Olympiacos", "Sporting Lisbon"],
  soccer_uefa_europa_conference_league: [
    "Chelsea",
    "Fiorentina",
    "Real Betis",
    "Sabah FK",
    "Legia Warsaw",
    "Copenhagen",
    "Hearts",
    "Slavia Prague",
  ],
};

const HOUR = 3600_000;
const anchor = new Date(FIXTURE_ANCHOR).getTime();

type Outcome = { name: string; price: number; point?: number };

function priceSet(probs: number[], margin: number, noise: number): number[] {
  const noisy = probs.map((p) => Math.max(0.02, p + between(-noise, noise)));
  const sum = noisy.reduce((a, b) => a + b, 0);
  return noisy.map((p) => round2(Math.max(1.01, 1 / ((p / sum) * (1 + margin)))));
}

function buildEvent(
  sportKey: string,
  idx: number,
  home: string,
  away: string,
  offsetHours: number,
  opts: { bookmakers?: number; noTotals?: boolean; wild?: boolean } = {},
) {
  const strength = between(-1, 1);
  const pDraw = between(0.2, 0.3);
  const pHome = (1 - pDraw) * (0.5 + strength * 0.4);
  const pAway = 1 - pDraw - pHome;
  const pOver = between(0.4, 0.68);
  const count = opts.bookmakers ?? Math.floor(between(9, BOOKMAKERS.length + 1));
  const noise = opts.wild ? 0.09 : 0.012;

  const bookmakers = BOOKMAKERS.slice(0, count).map(([key, title], b) => {
    const margin = key === "pinnacle" || key.includes("betfair") || key === "matchbook" ? between(0.015, 0.03) : between(0.04, 0.08);
    const [h, d, a] = priceSet([pHome, pDraw, pAway], margin, noise);
    const h2h: Outcome[] = [
      { name: home, price: h! },
      { name: away, price: a! },
      { name: "Draw", price: d! },
    ];
    // Edge case: one bookmaker publishes an incomplete 1X2 (no draw) on the first match.
    if (idx === 0 && b === 3) h2h.pop();

    const markets: { key: string; last_update: string; outcomes: Outcome[] }[] = [
      { key: "h2h", last_update: FIXTURE_ANCHOR, outcomes: h2h },
    ];
    // Edge case: a few bookmakers have no totals at all.
    if (!opts.noTotals && b % 5 !== 4) {
      const [o, u] = priceSet([pOver, 1 - pOver], margin, noise);
      const totals: Outcome[] = [
        { name: "Over", price: o!, point: 2.5 },
        { name: "Under", price: u!, point: 2.5 },
      ];
      // Edge case: some bookmakers also list other lines that must be ignored.
      if (b % 4 === 1) {
        totals.push({ name: "Over", price: round2(o! * 1.6), point: 3.5 }, { name: "Under", price: round2(u! * 0.75), point: 3.5 });
      }
      markets.push({ key: "totals", last_update: FIXTURE_ANCHOR, outcomes: totals });
    }
    return { key, title, last_update: FIXTURE_ANCHOR, markets };
  });

  const id = `mock_${sportKey.replace("soccer_", "")}_${idx}`;
  return {
    id,
    sport_key: sportKey,
    sport_title: sportKey,
    commence_time: new Date(anchor + offsetHours * HOUR).toISOString().replace(/\.\d{3}Z$/, "Z"),
    home_team: home,
    away_team: away,
    bookmakers,
  };
}

mkdirSync("fixtures/odds", { recursive: true });
mkdirSync("fixtures/events", { recursive: true });

for (const { key } of COMPETITIONS.filter((c) => c.sport === "soccer")) {
  const teams = TEAMS[key]!;
  const events = [];
  for (let i = 0; i < teams.length / 2; i++) {
    const offset = 20 + i * 26 + Math.floor(between(0, 6)); // spread over the next ~5 days
    events.push(
      buildEvent(key, i, teams[2 * i]!, teams[2 * i + 1]!, offset, {
        bookmakers: i === 2 ? 6 : undefined, // below MIN_BOOKMAKERS → skipped
        noTotals: i === 3,
        wild: i === 1, // high disagreement → excluded from templates
      }),
    );
  }
  // Edge cases for the sync window: one already started, one beyond 7 days.
  events.push(buildEvent(key, 90, teams[1]!, teams[0]!, -2));
  events.push(buildEvent(key, 91, teams[3]!, teams[2]!, 24 * 9));

  writeFileSync(`fixtures/odds/${key}.json`, JSON.stringify(events, null, 2) + "\n");
  const plainEvents = events.map((e) => ({
    id: e.id,
    sport_key: e.sport_key,
    sport_title: e.sport_title,
    commence_time: e.commence_time,
    home_team: e.home_team,
    away_team: e.away_team,
  }));
  writeFileSync(`fixtures/events/${key}.json`, JSON.stringify(plainEvents, null, 2) + "\n");
}

// ---- Basketball (generated after soccer so the soccer fixtures stay byte-identical) ----
// Winner is 2-way; bookmakers quote slightly different spread / total lines, as in the real API.

const NBA_TEAMS = [
  "Boston Celtics",
  "Los Angeles Lakers",
  "Denver Nuggets",
  "Milwaukee Bucks",
  "Golden State Warriors",
  "Phoenix Suns",
  "Miami Heat",
  "Dallas Mavericks",
  "New York Knicks",
  "Oklahoma City Thunder",
];

function buildBasketballEvent(
  idx: number,
  home: string,
  away: string,
  offsetHours: number,
  opts: { bookmakers?: number; wild?: boolean } = {},
) {
  const pHome = between(0.25, 0.8);
  const spread = -Math.round((pHome - 0.5) * 28) - 0.5; // home handicap, e.g. −6.5
  const total = Math.round(between(214, 238)) + 0.5;
  const count = opts.bookmakers ?? Math.floor(between(10, BOOKMAKERS.length + 1));
  const noise = opts.wild ? 0.09 : 0.012;

  const bookmakers = BOOKMAKERS.slice(0, count).map(([key, title], b) => {
    const margin = key === "pinnacle" || key.includes("betfair") || key === "matchbook" ? between(0.015, 0.03) : between(0.03, 0.06);
    const [h, a] = priceSet([pHome, 1 - pHome], margin, noise);
    // Most bookmakers share the main line; every third one is a point off, every seventh quotes a whole line (ignored).
    const shift = b % 3 === 2 ? 1 : 0;
    const sLine = spread - shift;
    const tLine = b % 7 === 6 ? total + 0.5 : total + shift;
    const [sh, sa] = priceSet([0.5, 0.5], margin, noise);
    const [o, u] = priceSet([0.5, 0.5], margin, noise);
    const markets = [
      {
        key: "h2h",
        last_update: FIXTURE_ANCHOR,
        outcomes: [
          { name: home, price: h! },
          { name: away, price: a! },
        ],
      },
      {
        key: "spreads",
        last_update: FIXTURE_ANCHOR,
        outcomes: [
          { name: home, price: sh!, point: sLine },
          { name: away, price: sa!, point: -sLine },
        ],
      },
      {
        key: "totals",
        last_update: FIXTURE_ANCHOR,
        outcomes: [
          { name: "Over", price: o!, point: tLine },
          { name: "Under", price: u!, point: tLine },
        ],
      },
    ];
    return { key, title, last_update: FIXTURE_ANCHOR, markets };
  });

  return {
    id: `mock_nba_${idx}`,
    sport_key: "basketball_nba",
    sport_title: "NBA",
    commence_time: new Date(anchor + offsetHours * HOUR).toISOString().replace(/\.\d{3}Z$/, "Z"),
    home_team: home,
    away_team: away,
    bookmakers,
  };
}

{
  const events = [];
  for (let i = 0; i < NBA_TEAMS.length / 2; i++) {
    const offset = 14 + i * 24 + Math.floor(between(0, 4)); // NBA tips off at night in Baku
    events.push(
      buildBasketballEvent(i, NBA_TEAMS[2 * i]!, NBA_TEAMS[2 * i + 1]!, offset, { bookmakers: i === 2 ? 6 : undefined, wild: i === 1 }),
    );
  }
  events.push(buildBasketballEvent(90, NBA_TEAMS[1]!, NBA_TEAMS[0]!, -2));
  writeFileSync("fixtures/odds/basketball_nba.json", JSON.stringify(events, null, 2) + "\n");
  const plainEvents = events.map((e) => ({
    id: e.id,
    sport_key: e.sport_key,
    sport_title: e.sport_title,
    commence_time: e.commence_time,
    home_team: e.home_team,
    away_team: e.away_team,
  }));
  writeFileSync("fixtures/events/basketball_nba.json", JSON.stringify(plainEvents, null, 2) + "\n");
}

console.log("fixtures written");
