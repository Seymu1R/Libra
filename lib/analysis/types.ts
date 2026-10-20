export type Market = "1X2" | "DC" | "OU25";
export type Selection = "HOME" | "DRAW" | "AWAY" | "1X" | "X2" | "12" | "OVER" | "UNDER";

export const MARKET_SELECTIONS = {
  "1X2": ["HOME", "DRAW", "AWAY"],
  DC: ["1X", "X2", "12"],
  OU25: ["OVER", "UNDER"],
} as const satisfies Record<Market, readonly Selection[]>;

/** One stored price (mirrors an OddsSnapshot row). */
export interface PriceRow {
  bookmaker: string;
  bookmakerTitle: string;
  /** API market key: h2h | totals */
  market: string;
  outcome: string;
  point: number | null;
  price: number;
}

export interface MatchInput {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  prices: PriceRow[];
}

export interface BestOdds {
  price: number;
  bookmaker: string;
  bookmakerTitle: string;
}

export interface SelectionAnalysis {
  market: Market;
  selection: Selection;
  /** Consensus (median, renormalized) probability, 0–1. */
  probability: number;
  /** max − min of per-bookmaker fair probabilities. */
  disagreement: number;
  bookmakerCount: number;
  /** 1 / probability. */
  fairOdds: number;
  /** Null for derived markets (double chance is not fetched). */
  bestOdds: BestOdds | null;
}

export interface MarketAnalysis {
  market: Market;
  bookmakerCount: number;
  selections: SelectionAnalysis[];
}

export interface MatchAnalysis {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  /** Markets that passed MIN_BOOKMAKERS; empty when the match is skipped. */
  markets: MarketAnalysis[];
  /** Bookmakers with a valid 1X2 price set. */
  bookmakerCount: number;
  skipped: boolean;
}
