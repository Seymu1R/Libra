export interface Combined {
  /** Product of leg probabilities — assumes the legs are independent. */
  combinedProbability: number;
  /** 1 / combinedProbability. */
  fairOdds: number;
}

export function combine(legs: readonly { probability: number }[]): Combined | null {
  if (legs.length === 0) return null;
  const combinedProbability = legs.reduce((p, l) => p * l.probability, 1);
  if (!(combinedProbability > 0)) return null;
  return { combinedProbability, fairOdds: 1 / combinedProbability };
}
