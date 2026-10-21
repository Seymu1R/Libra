import type { BestOdds, Market, MatchAnalysis, Selection } from "../analysis/types";
import type { TemplateRule, TemplateType } from "../config";
import { combine } from "./combine";

export interface Leg {
  matchId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  market: Market;
  /** Basketball spread / total line (see MarketAnalysis.line); absent otherwise. */
  line?: number | null;
  selection: Selection;
  probability: number;
  disagreement: number;
  bookmakerCount: number;
  bestOdds: BestOdds | null;
}

export interface BuiltTemplate {
  type: TemplateType;
  legs: Leg[];
  combinedProbability: number;
  fairOdds: number;
}

export interface BuildOptions {
  maxDisagreement: number;
  includeDoubleChance: boolean;
  /** Matches starting at or before this instant are excluded. */
  now: Date;
  /** Matches used by saved coupons. */
  blocked?: ReadonlySet<string>;
  /** A blocked match is still allowed with a selection whose probability is strictly above this. */
  repeatAllowedAbove?: number;
}

/** Saved-coupon repeat rule: a blocked match may reappear only with a high-probability selection. */
export function allowedDespiteBlock(leg: Pick<Leg, "matchId" | "probability">, blocked: ReadonlySet<string> | undefined, repeatAllowedAbove = 1): boolean {
  return !blocked?.has(leg.matchId) || leg.probability > repeatAllowedAbove;
}

const MARKET_ORDER: Record<Market, number> = { "1X2": 0, ML: 0, OU25: 1, OU35: 1, OU45: 1, SPR: 1, TOT: 1, DC: 2 };

/** Order-independent identity of a coupon's selections — equal for the same picks (and the same basketball line). */
export function couponSignature(legs: readonly { matchId: string; market: string; selection: string; line?: number | null }[]): string {
  return legs
    .map((l) => `${l.matchId}|${l.market}|${l.selection}|${l.line ?? ""}`)
    .sort()
    .join(";");
}

/** probability desc → disagreement asc → market → selection → match id. Fully deterministic. */
export function compareLegs(a: Leg, b: Leg): number {
  return (
    b.probability - a.probability ||
    a.disagreement - b.disagreement ||
    MARKET_ORDER[a.market] - MARKET_ORDER[b.market] ||
    a.selection.localeCompare(b.selection) ||
    a.matchId.localeCompare(b.matchId)
  );
}

/** Every selection of every analysable, not-yet-started match as a potential leg. */
export function allLegs(analyses: readonly MatchAnalysis[], now: Date): Leg[] {
  const legs: Leg[] = [];
  for (const m of analyses) {
    if (m.skipped || new Date(m.commenceTime).getTime() <= now.getTime()) continue;
    for (const market of m.markets) {
      for (const s of market.selections) {
        legs.push({
          matchId: m.id,
          competition: m.competition,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          commenceTime: m.commenceTime,
          market: s.market,
          line: market.line,
          selection: s.selection,
          probability: s.probability,
          disagreement: s.disagreement,
          bookmakerCount: s.bookmakerCount,
          bestOdds: s.bestOdds,
        });
      }
    }
  }
  return legs;
}

/**
 * Greedy, deterministic: best eligible selection per match (one leg per match — same-match
 * selections are correlated), then the top `maxLegs` across matches. Null if fewer than `minLegs`.
 * Matches in `exclude` are never used; matches in `opts.blocked` follow the repeat rule.
 */
export function buildTemplate(
  analyses: readonly MatchAnalysis[],
  rule: TemplateRule,
  opts: BuildOptions,
  exclude: ReadonlySet<string> = new Set(),
): BuiltTemplate | null {
  const eligible = allLegs(analyses, opts.now).filter(
    (l) =>
      l.probability >= rule.minLegProbability &&
      l.disagreement <= opts.maxDisagreement &&
      (opts.includeDoubleChance || l.market !== "DC") &&
      !exclude.has(l.matchId) &&
      allowedDespiteBlock(l, opts.blocked, opts.repeatAllowedAbove),
  );

  const bestPerMatch = new Map<string, Leg>();
  for (const leg of [...eligible].sort(compareLegs)) {
    if (!bestPerMatch.has(leg.matchId)) bestPerMatch.set(leg.matchId, leg);
  }

  const legs = [...bestPerMatch.values()].sort(compareLegs).slice(0, rule.maxLegs);
  if (legs.length < rule.minLegs) return null;

  const combined = combine(legs)!;
  return { type: rule.type, legs, ...combined };
}

/** Built in rule order; a match used by one auto template is not used by the next ones. */
export function buildTemplates(
  analyses: readonly MatchAnalysis[],
  rules: readonly TemplateRule[],
  opts: BuildOptions,
): { rule: TemplateRule; template: BuiltTemplate | null }[] {
  const used = new Set<string>();
  return rules.map((rule) => {
    const template = buildTemplate(analyses, rule, opts, used);
    template?.legs.forEach((l) => used.add(l.matchId));
    return { rule, template };
  });
}
