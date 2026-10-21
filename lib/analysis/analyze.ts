import { h2hBooks, totalsBooks } from "./book-prices";
import { bookFairProbabilities, consensusMarket, doubleChance } from "./consensus";
import { MARKET_SELECTIONS, TOTALS_LINES, type MarketAnalysis, type MatchAnalysis, type MatchInput, type TotalsMarket } from "./types";

export interface AnalysisOptions {
  minBookmakers: number;
  /** In order of preference when two lines have the same bookmaker count. */
  totalsMarkets: readonly TotalsMarket[];
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

    // One over/under line per match: the best-covered one (bookmakers rarely quote two lines for the same match).
    let best: MarketAnalysis | null = null;
    for (const market of opts.totalsMarkets) {
      const totals = totalsBooks(prices, TOTALS_LINES[market]);
      const totalsFair = bookFairProbabilities(totals, MARKET_SELECTIONS[market]);
      if (totalsFair.length >= opts.minBookmakers && totalsFair.length > (best?.bookmakerCount ?? 0)) {
        best = {
          market,
          bookmakerCount: totalsFair.length,
          selections: consensusMarket(market, totalsFair, MARKET_SELECTIONS[market], totals),
        };
      }
    }
    if (best) markets.push(best);
  }

  return { ...info, markets, bookmakerCount: h2hFair.length, skipped };
}

export function analyzeMatches(inputs: readonly MatchInput[], opts: AnalysisOptions): MatchAnalysis[] {
  return inputs.map((m) => analyzeMatch(m, opts)).sort((a, b) => a.commenceTime.localeCompare(b.commenceTime) || a.id.localeCompare(b.id));
}
