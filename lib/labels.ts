import type { Market, Selection } from "./analysis/types";

export const MARKET_LABEL: Record<Market, string> = {
  "1X2": "1X2",
  DC: "İkili şans",
  OU25: "Üst/Alt 2.5",
};

export const SELECTION_LABEL: Record<Selection, string> = {
  HOME: "1",
  DRAW: "X",
  AWAY: "2",
  "1X": "1X",
  X2: "X2",
  "12": "12",
  OVER: "Üst 2.5",
  UNDER: "Alt 2.5",
};

export const TEMPLATE_LABEL: Record<string, string> = {
  SABIT: "Sabit",
  BALANSLI: "Balanslı",
  RISKLI: "Riskli",
  CUSTOM: "Fərdi",
};

export const SYNC_STATUS_LABEL: Record<string, string> = {
  running: "gedir",
  success: "uğurlu",
  partial: "qismən",
  failed: "uğursuz",
};

/** Human description of a selection, e.g. "Arsenal qalib", "Heç-heçə və ya Chelsea". */
export function describeSelection(selection: string, home: string, away: string): string {
  switch (selection) {
    case "HOME": return `${home} qalib`;
    case "DRAW": return "Heç-heçə";
    case "AWAY": return `${away} qalib`;
    case "1X": return `${home} və ya heç-heçə`;
    case "X2": return `Heç-heçə və ya ${away}`;
    case "12": return "Heç-heçə olmayacaq";
    case "OVER": return "2.5-dən çox qol";
    case "UNDER": return "2.5-dən az qol";
    default: return selection;
  }
}
