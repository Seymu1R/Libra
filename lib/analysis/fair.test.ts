import { describe, expect, it } from "vitest";
import { fairProbabilities, margin } from "./fair";

describe("fairProbabilities", () => {
  it("removes the margin by normalizing 1/odds", () => {
    // implied: 0.5, 0.285714, 0.25 → sum 1.035714
    const fair = fairProbabilities([2.0, 3.5, 4.0])!;
    expect(fair[0]).toBeCloseTo(0.482759, 5);
    expect(fair[1]).toBeCloseTo(0.275862, 5);
    expect(fair[2]).toBeCloseTo(0.241379, 5);
    expect(fair.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it("two-way market", () => {
    const fair = fairProbabilities([1.9, 1.9])!;
    expect(fair).toEqual([0.5, 0.5]);
  });

  it("rejects invalid prices", () => {
    expect(fairProbabilities([1.0, 3, 4])).toBeNull();
    expect(fairProbabilities([Number.NaN, 3, 4])).toBeNull();
    expect(fairProbabilities([2])).toBeNull();
  });

  it("computes overround", () => {
    expect(margin([1.9, 1.9])).toBeCloseTo(0.052632, 5);
  });
});
