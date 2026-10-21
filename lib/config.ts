// Single source of truth for every threshold and competition key (project-context rule 6).

export const ODDS_API_BASE_URL = "https://api.the-odds-api.com";

export const ODDS_REQUEST = {
  regions: "eu",
  markets: "h2h,totals",
  oddsFormat: "decimal",
} as const;

// Keys from the official docs (ProjectDocs/APIDocs/the-odds-api-v4.md).
// `npm run verify:sports` confirms them against a live /v4/sports call.
export const COMPETITIONS = [
  { key: "soccer_epl", name: "Premyer Liqa (İngiltərə)" },
  { key: "soccer_spain_la_liga", name: "La Liqa (İspaniya)" },
  { key: "soccer_italy_serie_a", name: "Seriya A (İtaliya)" },
  { key: "soccer_germany_bundesliga", name: "Bundesliqa (Almaniya)" },
  { key: "soccer_france_ligue_one", name: "Liqa 1 (Fransa)" },
  { key: "soccer_uefa_champs_league", name: "UEFA Çempionlar Liqası" },
  { key: "soccer_uefa_europa_league", name: "UEFA Avropa Liqası" },
  { key: "soccer_uefa_europa_conference_league", name: "UEFA Konfrans Liqası" },
] as const;

export type CompetitionKey = (typeof COMPETITIONS)[number]["key"];

export const COMPETITION_KEYS: readonly CompetitionKey[] = COMPETITIONS.map((c) => c.key);

export function competitionName(key: string): string {
  return COMPETITIONS.find((c) => c.key === key)?.name ?? key;
}

export const SYNC = {
  /** Only matches starting within the next N days. */
  daysAhead: 7,
  /** Minimum minutes between two syncs against the real API. */
  cooldownMinutes: 30,
  /** Cooldown when USE_MOCK_DATA=true (fixtures cost nothing). */
  mockCooldownMinutes: 0,
} as const;

export const ANALYSIS = {
  /** Markets (and therefore matches) with fewer valid bookmakers are skipped. */
  minBookmakers: 8,
  /** Only this totals line is analysed. */
  totalsLine: 2.5,
} as const;

export type TemplateType = "SABIT" | "BALANSLI" | "RISKLI";

export interface TemplateRule {
  type: TemplateType;
  label: string;
  minLegs: number;
  maxLegs: number;
  /** Minimum consensus probability for each leg (0–1). */
  minLegProbability: number;
}

export const TEMPLATES = {
  /** Selections whose disagreement (max − min fair probability) exceeds this are excluded. */
  maxDisagreement: 0.08,
  /** Include derived double-chance selections in auto templates. */
  includeDoubleChance: true,
  /**
   * A match already used in a saved coupon may appear again only with a selection whose probability
   * is strictly above this. Auto templates never share a match with each other (no exception).
   */
  repeatAllowedAbove: 0.7,
  rules: [
    { type: "SABIT", label: "Sabit", minLegs: 2, maxLegs: 3, minLegProbability: 0.7 },
    { type: "BALANSLI", label: "Balanslı", minLegs: 3, maxLegs: 4, minLegProbability: 0.6 },
    { type: "RISKLI", label: "Riskli", minLegs: 4, maxLegs: 6, minLegProbability: 0.5 },
  ] satisfies TemplateRule[],
} as const;

/**
 * Saved (user-kept) coupon types: manual builder, generator, and a kept system suggestion (`SAVED_<rule type>`).
 * Their matches are blocked for new coupons — see `repeatAllowedAbove`.
 */
export const SAVED_TEMPLATE_TYPES = ["CUSTOM", "GENERATED", "SAVED_SABIT", "SAVED_BALANSLI", "SAVED_RISKLI"] as const;
export type SavedTemplateType = (typeof SAVED_TEMPLATE_TYPES)[number];

export const savedTypeFor = (type: TemplateType): SavedTemplateType => `SAVED_${type}`;

export const GENERATOR = {
  /** The generator picks the leg count itself, within these bounds (fewest legs that hit the goal). */
  minLegs: 2,
  maxLegs: 8,
  /** Legs below this probability are never used (avoids long-shot legs). */
  minLegProbability: 0.2,
  /** "Hədəf" mode: accepted when the coupon probability is within ±this (relative) of the target. */
  targetTolerance: 0.05,
} as const;

export const DISPLAY = {
  timeZone: "Asia/Baku",
  /** Asia/Baku has no DST since 2016 — day boundaries for date filters use this fixed offset. */
  utcOffset: "+04:00",
} as const;
