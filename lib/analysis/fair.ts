import { normalize } from "./stats";

/**
 * Removes the bookmaker margin: implied = 1/odds, then normalized so the market sums to 1.
 * Returns null when any price is not a valid decimal price (> 1, finite).
 */
export function fairProbabilities(prices: readonly number[]): number[] | null {
  if (prices.length < 2 || prices.some((p) => !Number.isFinite(p) || p <= 1)) return null;
  return normalize(prices.map((p) => 1 / p));
}

/** Bookmaker overround, e.g. 0.05 for a 5% margin. */
export function margin(prices: readonly number[]): number {
  return prices.reduce((a, p) => a + 1 / p, 0) - 1;
}
