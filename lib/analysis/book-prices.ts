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
