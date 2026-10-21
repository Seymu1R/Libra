import { describe, expect, it } from "vitest";
import type { Leg } from "./build";
import { generateCoupon, realOdds } from "./generate";

function leg(matchId: string, selection: Leg["selection"], probability: number, price: number | null = null, disagreement = 0.02): Leg {
  return {
    matchId,
    competition: "soccer_epl",
    homeTeam: `${matchId}-home`,
    awayTeam: `${matchId}-away`,
    commenceTime: "2026-10-21T19:00:00Z",
    market: selection === "1X" || selection === "X2" || selection === "12" ? "DC" : "1X2",
    selection,
    probability,
    disagreement,
    bookmakerCount: 10,
    bestOdds: price === null ? null : { price, bookmaker: "b", bookmakerTitle: "B" },
  };
}

// 8 matches, each with a favourite, an outsider and a double chance.
const POOL: Leg[] = ["a", "b", "c", "d", "e", "f", "g", "h"].flatMap((id, i) => {
  const fav = 0.5 + i * 0.03;
  return [leg(id, "HOME", fav, (1 / fav) * 1.02), leg(id, "AWAY", 0.95 - fav - 0.2, 4), leg(id, "1X", 0.95 - i * 0.01)];
});
const OPTS = { maxDisagreement: 0.08 };
const matches = (legs: Leg[]) => legs.map((l) => l.matchId);

describe("generateCoupon", () => {
  it("target: hits the probability within tolerance, one leg per match", () => {
    const r = generateCoupon(POOL, { mode: "target", probability: 0.4 }, OPTS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Math.abs(r.coupon.combinedProbability / 0.4 - 1)).toBeLessThanOrEqual(0.05);
    expect(new Set(matches(r.coupon.legs)).size).toBe(r.coupon.legs.length);
    expect(r.coupon.fairOdds).toBeCloseTo(1 / r.coupon.combinedProbability, 12);
  });

  it("target: uses the fewest legs that reach the goal (at least minLegs)", () => {
    const r = generateCoupon(POOL, { mode: "target", probability: 0.4 }, OPTS);
    expect(r.ok && r.coupon.legs.length).toBe(2);
  });

  it("target: a fixed match count is respected", () => {
    for (const legs of [3, 5]) {
      const r = generateCoupon(POOL, { mode: "target", probability: 0.2, legs }, OPTS);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.coupon.legs).toHaveLength(legs);
      expect(new Set(matches(r.coupon.legs)).size).toBe(legs);
      expect(Math.abs(r.coupon.combinedProbability / 0.2 - 1)).toBeLessThanOrEqual(0.05);
    }
  });

  it("target: explains an impossible or invalid match count", () => {
    const impossible = generateCoupon(POOL, { mode: "target", probability: 0.9, legs: 8 }, OPTS);
    expect(impossible.ok).toBe(false);
    if (!impossible.ok) expect(impossible.error).toContain("8 matçla");
    const tooMany = generateCoupon(
      POOL.filter((l) => "abc".includes(l.matchId)),
      { mode: "target", probability: 0.3, legs: 5 },
      OPTS,
    );
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) expect(tooMany.error).toContain("yalnız 3 uyğun matç");
    for (const legs of [1, 9, 2.5]) expect(generateCoupon(POOL, { mode: "target", probability: 0.3, legs }, OPTS).ok).toBe(false);
  });

  it("is deterministic regardless of input order", () => {
    const a = generateCoupon(POOL, { mode: "target", probability: 0.3 }, OPTS);
    const b = generateCoupon([...POOL].reverse(), { mode: "target", probability: 0.3 }, OPTS);
    expect(a).toEqual(b);
  });

  it("range: probability within [minProbability, 1 / minOdds]", () => {
    const r = generateCoupon(POOL, { mode: "range", minOdds: 2, minProbability: 0.4 }, OPTS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.coupon.combinedProbability).toBeGreaterThanOrEqual(0.4);
    expect(r.coupon.fairOdds).toBeGreaterThanOrEqual(2);
  });

  it("range: contradictory goals are rejected with an explanation", () => {
    const r = generateCoupon(POOL, { mode: "range", minOdds: 5, minProbability: 0.6 }, OPTS);
    expect(r).toEqual({ ok: false, error: expect.stringMatching(/ziddiyyətlidir/) });
  });

  it("real: real odds and probability both meet the minimums; no legs without a price", () => {
    const r = generateCoupon(POOL, { mode: "real", minRealOdds: 3, minProbability: 0.3 }, OPTS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.coupon.realOdds).toBeGreaterThanOrEqual(3);
    expect(r.coupon.combinedProbability).toBeGreaterThanOrEqual(0.3);
    expect(r.coupon.legs.every((l) => l.bestOdds !== null)).toBe(true);
  });

  it("skips blocked matches unless the selection is above repeatAllowedAbove", () => {
    const blocked = new Set(["a", "b", "c", "d", "e", "f"]);
    const r = generateCoupon(POOL, { mode: "target", probability: 0.4 }, { ...OPTS, blocked, repeatAllowedAbove: 0.7 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (const l of r.coupon.legs) {
      if (blocked.has(l.matchId)) expect(l.probability).toBeGreaterThan(0.7);
    }
  });

  it("excludes high-disagreement legs", () => {
    const noisy = POOL.map((l) => (l.matchId === "a" ? { ...l, disagreement: 0.2 } : l));
    const r = generateCoupon(noisy, { mode: "target", probability: 0.25 }, OPTS);
    expect(r.ok && matches(r.coupon.legs)).not.toContain("a");
  });

  it("reports when there are not enough matches", () => {
    const r = generateCoupon(
      POOL.filter((l) => l.matchId === "a"),
      { mode: "target", probability: 0.4 },
      OPTS,
    );
    expect(r.ok).toBe(false);
  });

  it("rejects out-of-range input", () => {
    expect(generateCoupon(POOL, { mode: "target", probability: 1.2 }, OPTS).ok).toBe(false);
    expect(generateCoupon(POOL, { mode: "real", minRealOdds: 0.5, minProbability: 0.3 }, OPTS).ok).toBe(false);
  });
});

describe("realOdds", () => {
  it("multiplies best prices; null when any leg has none", () => {
    expect(realOdds([leg("a", "HOME", 0.5, 2), leg("b", "HOME", 0.5, 1.5)])).toBeCloseTo(3, 12);
    expect(realOdds([leg("a", "HOME", 0.5, 2), leg("b", "1X", 0.8)])).toBeNull();
  });
});

describe("generateCoupon — search quality", () => {
  it("real: finds a pair that only works thanks to high-value legs", () => {
    // Only x+y beat real ≥ 4 with probability ≥ 25%: value (price × p) 1.1 each.
    const pool = [
      leg("x", "HOME", 0.5, 2.2),
      leg("y", "HOME", 0.52, 1.1 / 0.52),
      ...["a", "b", "c", "d"].map((id) => leg(id, "HOME", 0.5, 1.8)),
    ];
    const r = generateCoupon(pool, { mode: "real", minRealOdds: 4, minProbability: 0.25 }, OPTS);
    expect(r.ok && matches(r.coupon.legs).sort()).toEqual(["x", "y"]);
  });
});
