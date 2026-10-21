import { TOTALS_LINES, type Market, type Selection } from "./analysis/types";

export const MARKET_LABEL: Record<Market, string> = {
  "1X2": "1X2",
  DC: "İkili şans",
  OU25: "Üst/Alt 2.5",
  OU35: "Üst/Alt 3.5",
  OU45: "Üst/Alt 4.5",
};

const totalsLine = (market: string) => TOTALS_LINES[market as keyof typeof TOTALS_LINES] ?? 2.5;

const SELECTION_LABEL: Record<Exclude<Selection, "OVER" | "UNDER">, string> = {
  HOME: "1",
  DRAW: "X",
  AWAY: "2",
  "1X": "1X",
  X2: "X2",
  "12": "12",
};

/** Short selection label, e.g. "1", "X2", "Üst 3.5" (the over/under line comes from the market). */
export function selectionLabel(market: string, selection: string): string {
  if (selection === "OVER") return `Üst ${totalsLine(market)}`;
  if (selection === "UNDER") return `Alt ${totalsLine(market)}`;
  return SELECTION_LABEL[selection as keyof typeof SELECTION_LABEL] ?? selection;
}

export const TEMPLATE_LABEL: Record<string, string> = {
  SABIT: "Sabit",
  BALANSLI: "Balanslı",
  RISKLI: "Riskli",
  CUSTOM: "Fərdi",
  GENERATED: "Generator",
  SAVED_SABIT: "Sistem · Sabit",
  SAVED_BALANSLI: "Sistem · Balanslı",
  SAVED_RISKLI: "Sistem · Riskli",
};

export const SYNC_STATUS_LABEL: Record<string, string> = {
  running: "gedir",
  success: "uğurlu",
  partial: "qismən",
  failed: "uğursuz",
};

/** Human description of a selection, e.g. "Arsenal qalib", "Heç-heçə və ya Chelsea". */
export function describeSelection(market: string, selection: string, home: string, away: string): string {
  switch (selection) {
    case "HOME": return `${home} qalib`;
    case "DRAW": return "Heç-heçə";
    case "AWAY": return `${away} qalib`;
    case "1X": return `${home} və ya heç-heçə`;
    case "X2": return `Heç-heçə və ya ${away}`;
    case "12": return "Heç-heçə olmayacaq";
    case "OVER": return `${totalsLine(market)}-dən çox qol`;
    case "UNDER": return `${totalsLine(market)}-dən az qol`;
    default: return selection;
  }
}
