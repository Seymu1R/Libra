import { describe, expect, it } from "vitest";
import { analyzeMatch, analyzeMatches } from "./analyze";
import type { MatchInput, PriceRow } from "./types";

const HOME = "Arsenal";
const AWAY = "Chelsea";

function book(key: string, h: number, d: number, a: number, totals?: [number, number, number]): PriceRow[] {
  const base = { bookmaker: key, bookmakerTitle: key.toUpperCase(), point: null };
  const rows: PriceRow[] = [
    { ...base, market: "h2h", outcome: HOME, price: h },
    { ...base, market: "h2h", outcome: "Draw", price: d },
    { ...base, market: "h2h", outcome: AWAY, price: a },
  ];
  if (totals) {
    const [line, o, u] = totals;
    rows.push(
      { ...base, market: "totals", outcome: "Over", point: line, price: o },
      { ...base, market: "totals", outcome: "Under", point: line, price: u },
    );
  }
  return rows;
}

function match(prices: PriceRow[], id = "m1", commenceTime = "2026-10-21T19:00:00Z"): MatchInput {
  return { id, competition: "soccer_epl", homeTeam: HOME, awayTeam: AWAY, commenceTime, prices };
}

const OPTS = { minBookmakers: 3, totalsMarkets: ["OU25", "OU35", "OU45"] as const };

describe("analyzeMatch", () => {
  it("produces 1X2, DC and OU25 when enough bookmakers", () => {
    const prices = ["a", "b", "c"].flatMap((k) => book(k, 2.0, 3.5, 4.0, [2.5, 1.9, 1.9]));
    const r = analyzeMatch(match(prices), OPTS);
    expect(r.skipped).toBe(false);
    expect(r.markets.map((m) => m.market)).toEqual(["1X2", "DC", "OU25"]);
    const home = r.markets[0]!.selections[0]!;
    expect(home.probability).toBeCloseTo(0.482759, 5);
    expect(home.disagreement).toBeCloseTo(0, 12);
    expect(home.bestOdds?.price).toBe(2.0);
    expect(r.markets[2]!.selections[0]!.probability).toBeCloseTo(0.5, 12);
  });

  it("skips the match below MIN_BOOKMAKERS", () => {
    const prices = ["a", "b"].flatMap((k) => book(k, 2.0, 3.5, 4.0));
    const r = analyzeMatch(match(prices), OPTS);
    expect(r.skipped).toBe(true);
    expect(r.markets).toEqual([]);
    expect(r.bookmakerCount).toBe(2);
  });

  it("drops bookmakers with an incomplete 1X2 set", () => {
    const incomplete = book("d", 2.0, 3.5, 4.0).filter((r) => r.outcome !== "Draw");
    const prices = [...["a", "b", "c"].flatMap((k) => book(k, 2.0, 3.5, 4.0)), ...incomplete];
    expect(analyzeMatch(match(prices), OPTS).bookmakerCount).toBe(3);
  });

  it("drops bookmakers with invalid prices", () => {
    const prices = [...["a", "b"].flatMap((k) => book(k, 2.0, 3.5, 4.0)), ...book("c", 1.0, 3.5, 4.0)];
    expect(analyzeMatch(match(prices), OPTS).skipped).toBe(true);
  });

  it("uses the 3.5 line when bookmakers quote it instead of 2.5", () => {
    const prices = ["a", "b", "c"].flatMap((k) => [...book(k, 2.0, 3.5, 4.0, [3.5, 1.9, 1.9])]);
    const r = analyzeMatch(match(prices), OPTS);
    expect(r.markets.map((m) => m.market)).toEqual(["1X2", "DC", "OU35"]);
    expect(r.markets[2]!.selections[0]!.probability).toBeCloseTo(0.5, 12);
  });

  it("ignores lines that are not configured (Asian lines, 1.5)", () => {
    const prices = ["a", "b", "c"].flatMap((k) => [
      ...book(k, 2.0, 3.5, 4.0, [3.0, 1.9, 1.9]),
      ...book(k, 2, 3.5, 4, [1.5, 1.3, 3.4]).filter((r) => r.market === "totals"),
    ]);
    expect(analyzeMatch(match(prices), OPTS).markets.map((m) => m.market)).toEqual(["1X2", "DC"]);
    const only25 = analyzeMatch(match(["a", "b", "c"].flatMap((k) => book(k, 2, 3.5, 4, [3.5, 1.9, 1.9]))), {
      ...OPTS,
      totalsMarkets: ["OU25"],
    });
    expect(only25.markets.map((m) => m.market)).toEqual(["1X2", "DC"]);
  });

  it("keeps one line per match: the one with more bookmakers, ties → the earlier configured line", () => {
    const split = [
      ...["a", "b", "c"].flatMap((k) => book(k, 2, 3.5, 4, [2.5, 1.9, 1.9])),
      ...["d", "e", "f", "g"].flatMap((k) => book(k, 2, 3.5, 4, [3.5, 1.9, 1.9])),
    ];
    expect(
      analyzeMatch(match(split), OPTS)
        .markets.filter((m) => m.market.startsWith("OU"))
        .map((m) => m.market),
    ).toEqual(["OU35"]);
    const tie = [
      ...["a", "b", "c"].flatMap((k) => book(k, 2, 3.5, 4, [3.5, 1.9, 1.9])),
      ...["d", "e", "f"].flatMap((k) => book(k, 2, 3.5, 4, [2.5, 1.9, 1.9])),
    ];
    expect(
      analyzeMatch(match(tie), OPTS)
        .markets.filter((m) => m.market.startsWith("OU"))
        .map((m) => m.market),
    ).toEqual(["OU25"]);
  });

  it("keeps the 2.5 pair when every bookmaker lists several lines", () => {
    const prices = ["a", "b", "c"].flatMap((k) => [
      ...book(k, 2.0, 3.5, 4.0, [2.5, 2.0, 1.8]),
      ...book(k, 2.0, 3.5, 4.0, [3.5, 3.0, 1.35]).filter((r) => r.market === "totals"),
    ]);
    const ou = analyzeMatch(match(prices), OPTS).markets.find((m) => m.market === "OU25")!;
    expect(ou.bookmakerCount).toBe(3);
    expect(ou.selections[0]!.probability).toBeCloseTo(1 / 2.0 / (1 / 2.0 + 1 / 1.8), 12);
  });

  it("skips OU25 alone when it has too few bookmakers", () => {
    const prices = [...book("a", 2, 3.5, 4, [2.5, 1.9, 1.9]), ...["b", "c"].flatMap((k) => book(k, 2, 3.5, 4))];
    const r = analyzeMatch(match(prices), OPTS);
    expect(r.skipped).toBe(false);
    expect(r.markets.some((m) => m.market === "OU25")).toBe(false);
  });

  it("measures disagreement across bookmakers", () => {
    const prices = [...book("a", 2.0, 3.5, 4.0), ...book("b", 2.0, 3.5, 4.0), ...book("c", 1.6, 4.0, 5.5)];
    const home = analyzeMatch(match(prices), OPTS).markets[0]!.selections[0]!;
    const fairC = 1 / 1.6 / (1 / 1.6 + 1 / 4.0 + 1 / 5.5);
    expect(home.disagreement).toBeCloseTo(fairC - 0.482759, 5);
    expect(home.bestOdds?.price).toBe(2.0);
    expect(home.bestOdds?.bookmaker).toBe("a");
  });
});

describe("analyzeMatches", () => {
  it("sorts by kickoff then id", () => {
    const p = ["a", "b", "c"].flatMap((k) => book(k, 2, 3.5, 4));
    const r = analyzeMatches(
      [match(p, "z", "2026-10-22T19:00:00Z"), match(p, "b", "2026-10-21T19:00:00Z"), match(p, "a", "2026-10-21T19:00:00Z")],
      OPTS,
    );
    expect(r.map((m) => m.id)).toEqual(["a", "b", "z"]);
  });
});

describe("analyzeMatch — basketball", () => {
  const H = "Boston Celtics";
  const A = "Los Angeles Lakers";
  const base = (key: string) => ({ bookmaker: key, bookmakerTitle: key.toUpperCase() });
  function nbaBook(key: string, ml: [number, number], spread?: [number, number, number], total?: [number, number, number]): PriceRow[] {
    const rows: PriceRow[] = [
      { ...base(key), market: "h2h", outcome: H, point: null, price: ml[0] },
      { ...base(key), market: "h2h", outcome: A, point: null, price: ml[1] },
    ];
    if (spread) {
      const [line, h, a] = spread;
      rows.push(
        { ...base(key), market: "spreads", outcome: H, point: line, price: h },
        { ...base(key), market: "spreads", outcome: A, point: -line, price: a },
      );
    }
    if (total) {
      const [line, o, u] = total;
      rows.push(
        { ...base(key), market: "totals", outcome: "Over", point: line, price: o },
        { ...base(key), market: "totals", outcome: "Under", point: line, price: u },
      );
    }
    return rows;
  }
  const nba = (prices: PriceRow[]): MatchInput => ({
    id: "n1",
    competition: "basketball_nba",
    homeTeam: H,
    awayTeam: A,
    commenceTime: "2026-10-22T00:00:00Z",
    prices,
  });

  it("winner is 2-way; spread and total use the line most bookmakers quote", () => {
    const prices = [
      ...["a", "b", "c"].flatMap((k) => nbaBook(k, [1.5, 2.6], [-4.5, 1.9, 1.9], [230.5, 1.9, 1.9])),
      ...nbaBook("d", [1.5, 2.6], [-5.5, 2.1, 1.7], [231.5, 2.1, 1.7]),
    ];
    const r = analyzeMatch(nba(prices), OPTS);
    expect(r.markets.map((m) => [m.market, m.line, m.bookmakerCount])).toEqual([
      ["ML", null, 4],
      ["SPR", -4.5, 3],
      ["TOT", 230.5, 3],
    ]);
    expect(r.markets[0]!.selections.map((s) => s.selection)).toEqual(["HOME", "AWAY"]);
    expect(r.markets[0]!.selections[0]!.probability).toBeCloseTo(1 / 1.5 / (1 / 1.5 + 1 / 2.6), 12);
    expect(r.markets[1]!.selections[0]!.probability).toBeCloseTo(0.5, 12);
  });

  it("ignores whole lines (push) and inconsistent spread pairs; skips without enough winner prices", () => {
    const whole = ["a", "b", "c"].flatMap((k) => nbaBook(k, [1.5, 2.6], [-4, 1.9, 1.9], [230, 1.9, 1.9]));
    expect(analyzeMatch(nba(whole), OPTS).markets.map((m) => m.market)).toEqual(["ML"]);
    const broken = ["a", "b", "c"].flatMap((k) =>
      nbaBook(k, [1.5, 2.6], [-4.5, 1.9, 1.9]).map((r) => (r.market === "spreads" && r.outcome === A ? { ...r, point: 3.5 } : r)),
    );
    expect(analyzeMatch(nba(broken), OPTS).markets.map((m) => m.market)).toEqual(["ML"]);
    expect(analyzeMatch(nba(["a", "b"].flatMap((k) => nbaBook(k, [1.5, 2.6]))), OPTS).skipped).toBe(true);
  });

  it("ties between lines → the lower line", () => {
    const prices = [
      ...["a", "b", "c"].flatMap((k) => nbaBook(k, [1.5, 2.6], undefined, [231.5, 1.9, 1.9])),
      ...["d", "e", "f"].flatMap((k) => nbaBook(k, [1.5, 2.6], undefined, [230.5, 1.9, 1.9])),
    ];
    expect(analyzeMatch(nba(prices), OPTS).markets.find((m) => m.market === "TOT")!.line).toBe(230.5);
  });
});
