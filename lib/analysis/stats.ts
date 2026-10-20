/** Median; for an even count the mean of the two middle values. Throws on empty input. */
export function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error("median of empty list");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Scales values so they sum to 1. */
export function normalize(values: readonly number[]): number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  if (!(sum > 0)) throw new Error("cannot normalize non-positive sum");
  return values.map((v) => v / sum);
}
