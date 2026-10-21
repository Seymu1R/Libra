import { describe, expect, it } from "vitest";
import type { MatchAnalysis, SelectionAnalysis } from "../analysis/types";
import type { TemplateRule } from "../config";
import { buildTemplate, buildTemplates } from "./build";

const NOW = new Date("2026-10-20T12:00:00Z");
const FUTURE = "2026-10-21T19:00:00Z";

function sel(market: SelectionAnalysis["market"], selection: SelectionAnalysis["selection"], probability: number, disagreement = 0.02): SelectionAnalysis {
  return { market, selection, probability, disagreement, bookmakerCount: 10, fairOdds: 1 / probability, bestOdds: null };
}

function m(id: string, selections: SelectionAnalysis[], extra: Partial<MatchAnalysis> = {}): MatchAnalysis {
  return {
    id,
    competition: "soccer_epl",
    homeTeam: `${id}-home`,
    awayTeam: `${id}-away`,
    commenceTime: FUTURE,
    bookmakerCount: 10,
    skipped: false,
    markets: [{ market: selections[0]!.market, line: null, bookmakerCount: 10, selections }],
    ...extra,
  };
}

const RULE: TemplateRule = { type: "SABIT", label: "Sabit", minLegs: 2, maxLegs: 3, minLegProbability: 0.7 };
const OPTS = { maxDisagreement: 0.08, includeDoubleChance: true, now: NOW };

describe("buildTemplate", () => {
  it("takes up to maxLegs highest-probability legs and combines them", () => {
    const t = buildTemplate(
      [m("a", [sel("DC", "1X", 0.9)]), m("b", [sel("DC", "1X", 0.8)]), m("c", [sel("DC", "1X", 0.85)]), m("d", [sel("DC", "1X", 0.75)])],
      RULE,
      OPTS,
    )!;
    expect(t.legs.map((l) => l.matchId)).toEqual(["a", "c", "b"]);
    expect(t.combinedProbability).toBeCloseTo(0.9 * 0.85 * 0.8, 12);
    expect(t.fairOdds).toBeCloseTo(1 / (0.9 * 0.85 * 0.8), 12);
  });

  it("uses at most one selection per match", () => {
    const t = buildTemplate([m("a", [sel("DC", "1X", 0.9), sel("DC", "12", 0.85)]), m("b", [sel("DC", "1X", 0.8)])], RULE, OPTS)!;
    expect(t.legs.map((l) => `${l.matchId}:${l.selection}`)).toEqual(["a:1X", "b:1X"]);
  });

  it("excludes legs above the disagreement threshold", () => {
    const t = buildTemplate(
      [m("a", [sel("DC", "1X", 0.95, 0.2), sel("DC", "12", 0.75)]), m("b", [sel("DC", "1X", 0.8)])],
      RULE,
      OPTS,
    )!;
    expect(t.legs.map((l) => `${l.matchId}:${l.selection}`)).toEqual(["b:1X", "a:12"]);
  });

  it("returns null when fewer than minLegs qualify", () => {
    expect(buildTemplate([m("a", [sel("DC", "1X", 0.9)]), m("b", [sel("DC", "1X", 0.6)])], RULE, OPTS)).toBeNull();
  });

  it("excludes skipped and already-started matches", () => {
    const t = buildTemplate(
      [
        m("a", [sel("DC", "1X", 0.9)]),
        m("b", [sel("DC", "1X", 0.95)], { skipped: true }),
        m("c", [sel("DC", "1X", 0.95)], { commenceTime: "2026-10-20T11:00:00Z" }),
        m("d", [sel("DC", "1X", 0.8)]),
      ],
      RULE,
      OPTS,
    )!;
    expect(t.legs.map((l) => l.matchId)).toEqual(["a", "d"]);
  });

  it("can exclude double chance", () => {
    const t = buildTemplate(
      [m("a", [sel("DC", "1X", 0.9), sel("1X2", "HOME", 0.72)]), m("b", [sel("1X2", "HOME", 0.71)])],
      RULE,
      { ...OPTS, includeDoubleChance: false },
    )!;
    expect(t.legs.every((l) => l.market === "1X2")).toBe(true);
  });

  it("is deterministic: ties broken by lower disagreement, then match id", () => {
    const input = [m("b", [sel("DC", "1X", 0.8, 0.05)]), m("a", [sel("DC", "1X", 0.8, 0.05)]), m("c", [sel("DC", "1X", 0.8, 0.01)])];
    const t1 = buildTemplate(input, RULE, OPTS)!;
    const t2 = buildTemplate([...input].reverse(), RULE, OPTS)!;
    expect(t1.legs.map((l) => l.matchId)).toEqual(["c", "a", "b"]);
    expect(t2.legs.map((l) => l.matchId)).toEqual(["c", "a", "b"]);
  });

  it("blocked (saved-coupon) matches reappear only with a selection above repeatAllowedAbove", () => {
    const input = [m("a", [sel("DC", "1X", 0.75), sel("1X2", "HOME", 0.7)]), m("b", [sel("DC", "1X", 0.72)]), m("c", [sel("DC", "1X", 0.71)])];
    const opts = { ...OPTS, blocked: new Set(["a", "b"]), repeatAllowedAbove: 0.73 };
    const t = buildTemplate(input, RULE, opts)!;
    // a:1X (0.75) is above the threshold → allowed; b (0.72) is not; a:HOME is never needed.
    expect(t.legs.map((l) => `${l.matchId}:${l.selection}`)).toEqual(["a:1X", "c:1X"]);
  });
});

describe("buildTemplates", () => {
  const RULES: TemplateRule[] = [
    { type: "SABIT", label: "Sabit", minLegs: 2, maxLegs: 2, minLegProbability: 0.7 },
    { type: "BALANSLI", label: "Balanslı", minLegs: 2, maxLegs: 2, minLegProbability: 0.6 },
    { type: "RISKLI", label: "Riskli", minLegs: 2, maxLegs: 2, minLegProbability: 0.5 },
  ];
  const input = ["a", "b", "c", "d", "e", "f"].map((id, i) => m(id, [sel("DC", "1X", 0.95 - i * 0.04)]));

  it("never shares a match between auto templates, even above repeatAllowedAbove", () => {
    const built = buildTemplates(input, RULES, { ...OPTS, repeatAllowedAbove: 0.7 });
    expect(built.map((b) => b.template!.legs.map((l) => l.matchId))).toEqual([["a", "b"], ["c", "d"], ["e", "f"]]);
  });

  it("returns null for a later template when earlier ones used up the matches", () => {
    const built = buildTemplates(input.slice(0, 5), RULES, OPTS);
    expect(built[2]!.template).toBeNull();
  });
});
