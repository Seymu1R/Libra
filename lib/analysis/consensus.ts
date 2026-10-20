import type { BookPrices } from "./book-prices";
import { fairProbabilities } from "./fair";
import { median, normalize } from "./stats";
import { MARKET_SELECTIONS, type BestOdds, type Market, type Selection, type SelectionAnalysis } from "./types";

export interface BookFair {
  bookmaker: string;
  fair: Partial<Record<Selection, number>>;
}

/** Per-bookmaker fair probabilities; bookmakers with invalid prices are dropped. */
export function bookFairProbabilities(books: readonly BookPrices[], selections: readonly Selection[]): BookFair[] {
  const out: BookFair[] = [];
  for (const b of books) {
    const fair = fairProbabilities(selections.map((s) => b.prices[s]!));
    if (!fair) continue;
    out.push({ bookmaker: b.bookmaker, fair: Object.fromEntries(selections.map((s, i) => [s, fair[i]!])) });
  }
  return out;
}

/** Highest price per selection; ties → alphabetically first bookmaker key (deterministic). */
export function bestOdds(books: readonly BookPrices[], selection: Selection): BestOdds | null {
  let best: BestOdds | null = null;
  for (const b of books) {
    const price = b.prices[selection];
    if (price === undefined) continue;
    if (!best || price > best.price || (price === best.price && b.bookmaker < best.bookmaker)) {
      best = { price, bookmaker: b.bookmaker, bookmakerTitle: b.bookmakerTitle };
    }
  }
  return best;
}

function spread(values: readonly number[]): number {
  return Math.max(...values) - Math.min(...values);
}

/** Median per selection across bookmakers, renormalized to sum to 1. */
export function consensusMarket(
  market: Market,
  fairs: readonly BookFair[],
  selections: readonly Selection[],
  books: readonly BookPrices[],
): SelectionAnalysis[] {
  const medians = selections.map((s) => median(fairs.map((f) => f.fair[s]!)));
  const probs = normalize(medians);
  return selections.map((s, i) => ({
    market,
    selection: s,
    probability: probs[i]!,
    disagreement: spread(fairs.map((f) => f.fair[s]!)),
    bookmakerCount: fairs.length,
    fairOdds: 1 / probs[i]!,
    bestOdds: bestOdds(books, s),
  }));
}

const DC_PARTS: Record<"1X" | "X2" | "12", [Selection, Selection]> = {
  "1X": ["HOME", "DRAW"],
  X2: ["DRAW", "AWAY"],
  "12": ["HOME", "AWAY"],
};

/**
 * Double chance derived from the 1X2 consensus (not fetched).
 * Disagreement uses each bookmaker's own summed fair probabilities. No best odds.
 */
export function doubleChance(oneXTwo: readonly SelectionAnalysis[], fairs: readonly BookFair[]): SelectionAnalysis[] {
  const p = (s: Selection) => oneXTwo.find((x) => x.selection === s)!.probability;
  // Explicit order: object key order would put the integer-like "12" first.
  return MARKET_SELECTIONS.DC.map((sel) => {
    const [a, b] = DC_PARTS[sel];
    const probability = p(a) + p(b);
    return {
      market: "DC",
      selection: sel,
      probability,
      disagreement: spread(fairs.map((f) => f.fair[a]! + f.fair[b]!)),
      bookmakerCount: fairs.length,
      fairOdds: 1 / probability,
      bestOdds: null,
    };
  });
}
