import { describe, expect, it } from "vitest";
import { formatOdds, formatPercent, formatPoints } from "./format";

describe("format", () => {
  it("percent with one decimal", () => expect(formatPercent(0.48276)).toBe("48,3%"));
  it("odds with two decimals", () => expect(formatOdds(2.0714)).toBe("2,07"));
  it("disagreement in points", () => expect(formatPoints(0.031)).toBe("3,1 b."));
});
