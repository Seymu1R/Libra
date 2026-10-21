import { TOTALS_LINES, type Market, type Selection } from "./analysis/types";

export const MARKET_LABEL: Record<Market, string> = {
  "1X2": "1X2",
  DC: "İkili şans",
  OU25: "Üst/Alt 2.5",
  OU35: "Üst/Alt 3.5",
  OU45: "Üst/Alt 4.5",
  ML: "Qalib",
  SPR: "Fora",
  TOT: "Total xal",
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

/** "+4.5" / "-4.5" */
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/** Line shown for an over/under: soccer from the market key (OU35 → 3.5), basketball from the leg's line. */
const pointsLine = (market: string, line?: number | null) => (market === "TOT" ? (line ?? "?") : totalsLine(market));

/** Handicap of the chosen side: SPR `line` is the home handicap, the away side gets −line. */
const handicap = (selection: string, line: number) => (selection === "HOME" ? line : -line);

/** Short selection label, e.g. "1", "X2", "Üst 3.5", "Üst 239.5", "1 -4.5" (fora). */
export function selectionLabel(market: string, selection: string, line?: number | null): string {
  if (selection === "OVER") return `Üst ${pointsLine(market, line)}`;
  if (selection === "UNDER") return `Alt ${pointsLine(market, line)}`;
  const base = SELECTION_LABEL[selection as keyof typeof SELECTION_LABEL] ?? selection;
  return market === "SPR" && line != null ? `${base} ${signed(handicap(selection, line))}` : base;
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

/** Human description of a selection, e.g. "Arsenal qalib", "Heç-heçə və ya Chelsea", "Lakers 4.5 xaldan çox fərqlə qalib". */
export function describeSelection(market: string, selection: string, home: string, away: string, line?: number | null): string {
  if (market === "SPR" && line != null && (selection === "HOME" || selection === "AWAY")) {
    const team = selection === "HOME" ? home : away;
    const h = handicap(selection, line);
    return h < 0 ? `${team} ${-h} xaldan çox fərqlə qalib` : `${team} qalib və ya ${h} xaldan az fərqlə uduzur`;
  }
  if (market === "ML" && (selection === "HOME" || selection === "AWAY"))
    return `${selection === "HOME" ? home : away} qalib (əlavə vaxt daxil)`;
  if (market === "TOT" && (selection === "OVER" || selection === "UNDER")) {
    return `${pointsLine(market, line)}-dən ${selection === "OVER" ? "çox" : "az"} xal`;
  }
  switch (selection) {
    case "HOME":
      return `${home} qalib`;
    case "DRAW":
      return "Heç-heçə";
    case "AWAY":
      return `${away} qalib`;
    case "1X":
      return `${home} və ya heç-heçə`;
    case "X2":
      return `Heç-heçə və ya ${away}`;
    case "12":
      return "Heç-heçə olmayacaq";
    case "OVER":
      return `${totalsLine(market)}-dən çox qol`;
    case "UNDER":
      return `${totalsLine(market)}-dən az qol`;
    default:
      return selection;
  }
}
