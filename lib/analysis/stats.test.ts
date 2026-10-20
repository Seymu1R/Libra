import { describe, expect, it } from "vitest";
import { median, normalize } from "./stats";

describe("median", () => {
  it("odd count → middle value", () => expect(median([3, 1, 2])).toBe(2));
  it("even count → mean of two middle values", () => expect(median([4, 1, 3, 2])).toBe(2.5));
  it("single value", () => expect(median([0.7])).toBe(0.7));
  it("throws on empty", () => expect(() => median([])).toThrow());
});

describe("normalize", () => {
  it("scales to sum 1", () => {
    const n = normalize([1, 1, 2]);
    expect(n).toEqual([0.25, 0.25, 0.5]);
  });
  it("throws on zero sum", () => expect(() => normalize([0, 0])).toThrow());
});
