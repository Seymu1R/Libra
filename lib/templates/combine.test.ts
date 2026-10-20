import { describe, expect, it } from "vitest";
import { combine } from "./combine";

describe("combine", () => {
  it("multiplies probabilities and inverts for fair odds", () => {
    const c = combine([{ probability: 0.8 }, { probability: 0.75 }])!;
    expect(c.combinedProbability).toBeCloseTo(0.6, 12);
    expect(c.fairOdds).toBeCloseTo(1 / 0.6, 12);
  });

  it("null for no legs", () => expect(combine([])).toBeNull());
});
