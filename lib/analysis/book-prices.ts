import type { PriceRow, Selection } from "./types";

export interface BookPrices {
  bookmaker: string;
  bookmakerTitle: string;
  prices: Partial<Record<Selection, number>>;
}

function groupByBookmaker(rows: readonly PriceRow[]): Map<string, PriceRow[]> {
  const map = new Map<string, PriceRow[]>();
  for (const r of rows) {
    const list = map.get(r.bookmaker);
    if (list) list.push(r);
    else map.set(r.bookmaker, [r]);
  }
  return map;
}

/**
 * Builds complete price sets per bookmaker for one market.
 * A bookmaker is dropped if any selection is missing or appears twice (ambiguous).
 */
function collect(
  rows: readonly PriceRow[],
  selections: readonly Selection[],
  mapOutcome: (row: PriceRow) => Selection | null,
): BookPrices[] {
  const result: BookPrices[] = [];
  for (const [bookmaker, list] of groupByBookmaker(rows)) {
    const prices: Partial<Record<Selection, number>> = {};
    let valid = true;
    for (const row of list) {
      const sel = mapOutcome(row);
      if (sel === null) continue;
      if (prices[sel] !== undefined) valid = false;
      prices[sel] = row.price;
    }
    if (valid && selections.every((s) => prices[s] !== undefined)) {
      result.push({ bookmaker, bookmakerTitle: list[0]!.bookmakerTitle, prices });
    }
  }
  return result.sort((a, b) => a.bookmaker.localeCompare(b.bookmaker));
}

export function h2hBooks(rows: readonly PriceRow[], homeTeam: string, awayTeam: string): BookPrices[] {
  const h2h = rows.filter((r) => r.market === "h2h");
  return collect(h2h, ["HOME", "DRAW", "AWAY"], (r) => {
    if (r.outcome === homeTeam) return "HOME";
    if (r.outcome === awayTeam) return "AWAY";
    if (r.outcome === "Draw") return "DRAW";
    return null;
  });
}

export function totalsBooks(rows: readonly PriceRow[], line: number): BookPrices[] {
  const totals = rows.filter((r) => r.market === "totals" && r.point === line);
  return collect(totals, ["OVER", "UNDER"], (r) => {
    if (r.outcome === "Over") return "OVER";
    if (r.outcome === "Under") return "UNDER";
    return null;
  });
}

/** Basketball winner (incl. overtime): two outcomes, no draw. */
export function moneylineBooks(rows: readonly PriceRow[], homeTeam: string, awayTeam: string): BookPrices[] {
  const h2h = rows.filter((r) => r.market === "h2h");
  return collect(h2h, ["HOME", "AWAY"], (r) => {
    if (r.outcome === homeTeam) return "HOME";
    if (r.outcome === awayTeam) return "AWAY";
    return null;
  });
}

const isHalfLine = (p: number | null): p is number => p !== null && Math.abs(p % 1) === 0.5;

/**
 * Basketball lines vary between bookmakers (e.g. 238.5 / 239.5), and a consensus needs one line.
 * Keeps the line quoted by the most bookmakers (ties → lower line) and only those bookmakers.
 * Whole lines (push → refund) are ignored. Spreads are keyed by the home handicap; the away side must be −home.
 */
export function mainLineBooks(
  rows: readonly PriceRow[],
  kind: "totals" | "spreads",
  homeTeam: string,
  awayTeam: string,
): { line: number; books: BookPrices[] } | null {
  const byLine = new Map<number, PriceRow[]>();
  for (const [, list] of groupByBookmaker(rows.filter((r) => r.market === kind))) {
    const line = lineOf(list, kind, homeTeam, awayTeam);
    if (line === null) continue;
    byLine.set(line, [...(byLine.get(line) ?? []), ...list]);
  }
  let best: { line: number; books: BookPrices[] } | null = null;
  for (const [line, list] of [...byLine].sort((a, b) => a[0] - b[0])) {
    const books =
      kind === "totals"
        ? collect(list, ["OVER", "UNDER"], (r) => (r.outcome === "Over" ? "OVER" : r.outcome === "Under" ? "UNDER" : null))
        : collect(list, ["HOME", "AWAY"], (r) => (r.outcome === homeTeam ? "HOME" : r.outcome === awayTeam ? "AWAY" : null));
    if (!best || books.length > best.books.length) best = { line, books };
  }
  return best;
}

/** The single line a bookmaker quotes, or null when it quotes several, a whole line, or an inconsistent spread pair. */
function lineOf(list: readonly PriceRow[], kind: "totals" | "spreads", homeTeam: string, awayTeam: string): number | null {
  if (kind === "totals") {
    const points = new Set(list.map((r) => r.point));
    const [only] = points;
    return points.size === 1 && isHalfLine(only ?? null) ? only! : null;
  }
  const home = list.filter((r) => r.outcome === homeTeam);
  const away = list.filter((r) => r.outcome === awayTeam);
  if (home.length !== 1 || away.length !== 1) return null;
  const h = home[0]!.point;
  return isHalfLine(h) && away[0]!.point === -h ? h : null;
}
