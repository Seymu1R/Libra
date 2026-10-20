// Hand-rolled (comma decimal, Azerbaijani style) instead of Intl az-AZ, whose locale data
// differs between Node and browsers.
function fixed(n: number, digits: number): string {
  return n.toFixed(digits).replace(".", ",");
}

/** 0.4827 → "48,3%" */
export const formatPercent = (p: number) => `${fixed(p * 100, 1)}%`;
/** 2.0714 → "2,07" */
export const formatOdds = (o: number) => fixed(o, 2);
/** Disagreement in percentage points: 0.031 → "3,1 b." */
export const formatPoints = (d: number) => `${fixed(d * 100, 1)} b.`;
