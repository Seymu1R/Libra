import { describe, expect, it } from "vitest";
import type { BookPrices } from "./book-prices";
import { bestOdds, consensusMarket, doubleChance, type BookFair } from "./consensus";

const SEL = ["HOME", "DRAW", "AWAY"] as const;

const fairs: BookFair[] = [
  { bookmaker: "a", fair: { HOME: 0.6, DRAW: 0.3, AWAY: 0.1 } },
  { bookmaker: "b", fair: { HOME: 0.5, DRAW: 0.2, AWAY: 0.3 } },
  { bookmaker: "c", fair: { HOME: 0.2, DRAW: 0.4, AWAY: 0.4 } },
];

describe("consensusMarket", () => {
  const result = consensusMarket("1X2", fairs, SEL, []);

  it("takes medians and renormalizes", () => {
    // medians 0.5 / 0.3 / 0.3 → sum 1.1
    expect(result[0]!.probability).toBeCloseTo(0.5 / 1.1, 12);
    expect(result[1]!.probability).toBeCloseTo(0.3 / 1.1, 12);
    expect(result[2]!.probability).toBeCloseTo(0.3 / 1.1, 12);
    expect(result.reduce((a, s) => a + s.probability, 0)).toBeCloseTo(1, 12);
  });

  it("disagreement = max − min of per-bookmaker fair probabilities", () => {
    expect(result[0]!.disagreement).toBeCloseTo(0.4, 12);
    expect(result[1]!.disagreement).toBeCloseTo(0.2, 12);
    expect(result[2]!.disagreement).toBeCloseTo(0.3, 12);
  });

  it("fair odds and bookmaker count", () => {
    expect(result[0]!.fairOdds).toBeCloseTo(2.2, 12);
    expect(result[0]!.bookmakerCount).toBe(3);
  });

  it("median is robust to a single outlier (unlike mean)", () => {
    const withOutlier: BookFair[] = [
      ...[0.5, 0.5, 0.5, 0.5].map((h, i) => ({ bookmaker: `b${i}`, fair: { HOME: h, DRAW: 0.25, AWAY: 0.25 } })),
      { bookmaker: "x", fair: { HOME: 0.9, DRAW: 0.05, AWAY: 0.05 } },
    ];
    const r = consensusMarket("1X2", withOutlier, SEL, []);
    expect(r[0]!.probability).toBeCloseTo(0.5, 12);
  });
});

describe("doubleChance", () => {
  const oneXTwo = consensusMarket("1X2", fairs, SEL, []);
  const dc = doubleChance(oneXTwo, fairs);

  it("derives probabilities from the 1X2 consensus", () => {
    expect(dc.map((d) => d.selection)).toEqual(["1X", "X2", "12"]);
    expect(dc[0]!.probability).toBeCloseTo(0.8 / 1.1, 12);
    expect(dc[1]!.probability).toBeCloseTo(0.6 / 1.1, 12);
    expect(dc[2]!.probability).toBeCloseTo(0.8 / 1.1, 12);
  });

  it("disagreement uses per-bookmaker summed probabilities; no best odds", () => {
    // 1X per book: 0.9, 0.7, 0.6 → 0.3
    expect(dc[0]!.disagreement).toBeCloseTo(0.3, 12);
    expect(dc[0]!.bestOdds).toBeNull();
  });
});

describe("bestOdds", () => {
  const books: BookPrices[] = [
    { bookmaker: "zeta", bookmakerTitle: "Zeta", prices: { HOME: 2.1 } },
    { bookmaker: "alpha", bookmakerTitle: "Alpha", prices: { HOME: 2.1 } },
    { bookmaker: "mid", bookmakerTitle: "Mid", prices: { HOME: 2.0 } },
  ];

  it("picks the highest price, ties → alphabetical bookmaker key", () => {
    expect(bestOdds(books, "HOME")).toEqual({ price: 2.1, bookmaker: "alpha", bookmakerTitle: "Alpha" });
  });

  it("null when no bookmaker prices the selection", () => {
    expect(bestOdds(books, "DRAW")).toBeNull();
  });
});
