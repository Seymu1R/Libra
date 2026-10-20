import { h2hBooks, totalsBooks } from "./book-prices";
import { bookFairProbabilities, consensusMarket, doubleChance } from "./consensus";
import { MARKET_SELECTIONS, type MarketAnalysis, type MatchAnalysis, type MatchInput } from "./types";

export interface AnalysisOptions {
  minBookmakers: number;
  totalsLine: number;
}

export function analyzeMatch(input: MatchInput, opts: AnalysisOptions): MatchAnalysis {
  const { prices, ...info } = input;
  const markets: MarketAnalysis[] = [];

  const h2h = h2hBooks(prices, input.homeTeam, input.awayTeam);
  const h2hFair = bookFairProbabilities(h2h, MARKET_SELECTIONS["1X2"]);
  const skipped = h2hFair.length < opts.minBookmakers;

  if (!skipped) {
    const oneXTwo = consensusMarket("1X2", h2hFair, MARKET_SELECTIONS["1X2"], h2h);
    markets.push({ market: "1X2", bookmakerCount: h2hFair.length, selections: oneXTwo });
    markets.push({ market: "DC", bookmakerCount: h2hFair.length, selections: doubleChance(oneXTwo, h2hFair) });

    const totals = totalsBooks(prices, opts.totalsLine);
    const totalsFair = bookFairProbabilities(totals, MARKET_SELECTIONS.OU25);
    if (totalsFair.length >= opts.minBookmakers) {
      markets.push({
        market: "OU25",
        bookmakerCount: totalsFair.length,
        selections: consensusMarket("OU25", totalsFair, MARKET_SELECTIONS.OU25, totals),
      });
    }
  }

  return { ...info, markets, bookmakerCount: h2hFair.length, skipped };
}

export function analyzeMatches(inputs: readonly MatchInput[], opts: AnalysisOptions): MatchAnalysis[] {
  return inputs
    .map((m) => analyzeMatch(m, opts))
    .sort((a, b) => a.commenceTime.localeCompare(b.commenceTime) || a.id.localeCompare(b.id));
}
