import { GENERATOR } from "../config";
import { allowedDespiteBlock, compareLegs, type Leg } from "./build";
import { combine } from "./combine";

/**
 * - target: coupon probability ≈ `probability` (the UI links it to fair odds = 1 / probability);
 *           optional `legs` fixes the leg count, otherwise the generator picks it
 * - range:  fair odds ≥ `minOdds` and probability ≥ `minProbability` → probability ∈ [minProbability, 1 / minOdds]
 * - real:   product of the best bookmaker prices ≥ `minRealOdds` and consensus probability ≥ `minProbability`
 */
export type GeneratorGoal =
  | { mode: "target"; probability: number; legs?: number }
  | { mode: "range"; minOdds: number; minProbability: number }
  | { mode: "real"; minRealOdds: number; minProbability: number };

export interface GeneratorOptions {
  maxDisagreement: number;
  blocked?: ReadonlySet<string>;
  repeatAllowedAbove?: number;
  minLegs?: number;
  maxLegs?: number;
  minLegProbability?: number;
  targetTolerance?: number;
}

export interface GeneratedCoupon {
  legs: Leg[];
  combinedProbability: number;
  fairOdds: number;
  /** Product of the best available bookmaker prices; null if any leg has none (e.g. double chance). */
  realOdds: number | null;
}

export type GenerateResult = { ok: true; coupon: GeneratedCoupon } | { ok: false; error: string };

export function realOdds(legs: readonly Pick<Leg, "bestOdds">[]): number | null {
  if (legs.length === 0) return null;
  let product = 1;
  for (const l of legs) {
    if (!l.bestOdds) return null;
    product *= l.bestOdds.price;
  }
  return product;
}

interface Window {
  lo: number;
  hi: number;
  minRealOdds: number | null;
  /** Probabilities to aim at; tried in order. */
  targets: number[];
  /** Lower is better among accepted coupons with the same leg count. */
  rank: (probability: number) => number;
}

function windowFor(goal: GeneratorGoal, tolerance: number): Window | string {
  const pct = (p: number) => `${(p * 100).toFixed(1).replace(".", ",")}%`;
  if (goal.mode === "target") {
    const p = goal.probability;
    if (!(p > 0 && p < 1)) return "Ehtimal 0% ilə 100% arasında olmalıdır.";
    return { lo: p * (1 - tolerance), hi: p * (1 + tolerance), minRealOdds: null, targets: [p], rank: (x) => Math.abs(Math.log(x / p)) };
  }
  if (!(goal.minProbability > 0 && goal.minProbability < 1)) return "Ehtimal 0% ilə 100% arasında olmalıdır.";
  if (goal.mode === "range") {
    if (!(goal.minOdds > 1)) return "Əmsal 1-dən böyük olmalıdır.";
    const lo = goal.minProbability;
    const hi = 1 / goal.minOdds;
    if (lo > hi) return `Şərtlər ziddiyyətlidir: əmsal ≥ ${goal.minOdds} olanda ehtimal ən çox ${pct(hi)} ola bilər.`;
    const mid = Math.sqrt(lo * hi);
    return { lo, hi, minRealOdds: null, targets: [mid], rank: (x) => Math.abs(Math.log(x / mid)) };
  }
  if (!(goal.minRealOdds > 1)) return "Əmsal 1-dən böyük olmalıdır.";
  // Real odds ≈ fair odds × value, so aim slightly above the minimum probability first, then higher.
  const lo = goal.minProbability;
  const top = Math.max(lo, Math.min(0.95, 1.3 / goal.minRealOdds));
  const steps = 10;
  const targets = Array.from({ length: steps + 1 }, (_, i) => lo * Math.pow(top / lo, i / steps));
  return { lo, hi: 1, minRealOdds: goal.minRealOdds, targets, rank: (x) => -x };
}

/**
 * Picks `k` legs (one per match) whose probability product is as close as possible to `target`.
 * `safeLegs` seeds the search with that many of the most likely legs and spreads the rest of the target
 * over the others — different seeds escape the local optima a single even split gets stuck in.
 */
function pickFor(candidates: readonly Leg[], k: number, target: number, preferValue: boolean, safeLegs = 0): Leg[] | null {
  const chosen: Leg[] = [];
  const taken = new Set<string>();
  const fill = (n: number, score: (l: Leg) => number) => {
    for (const l of [...candidates].sort((a, b) => score(a) - score(b) || compareLegs(a, b))) {
      if (chosen.length >= n) break;
      if (taken.has(l.matchId)) continue;
      chosen.push(l);
      taken.add(l.matchId);
    }
  };
  fill(safeLegs, (l) => -l.probability);
  const perLeg = (Math.log(target) - chosen.reduce((s, l) => s + Math.log(l.probability), 0)) / (k - chosen.length);
  fill(k, (l) => Math.abs(Math.log(l.probability) - perLeg) - (preferValue && l.bestOdds ? Math.log(l.bestOdds.price * l.probability) : 0));
  if (chosen.length < k) return null;

  // Local search: swap single legs while it moves the product closer to the target.
  const goal = Math.log(target);
  const sum = () => chosen.reduce((s, l) => s + Math.log(l.probability), 0);
  for (let iter = 0; iter < 4 * k; iter++) {
    const current = Math.abs(sum() - goal);
    let best: { i: number; leg: Leg; dist: number } | null = null;
    for (let i = 0; i < chosen.length; i++) {
      const others = new Set(chosen.filter((_, j) => j !== i).map((l) => l.matchId));
      const base = sum() - Math.log(chosen[i]!.probability);
      for (const c of candidates) {
        if (others.has(c.matchId) || c === chosen[i]) continue;
        const dist = Math.abs(base + Math.log(c.probability) - goal);
        if (
          dist < current - 1e-12 &&
          (!best || dist < best.dist - 1e-12 || (Math.abs(dist - best.dist) <= 1e-12 && compareLegs(c, best.leg) < 0))
        ) {
          best = { i, leg: c, dist };
        }
      }
    }
    if (!best) break;
    chosen[best.i] = best.leg;
  }
  return chosen.sort(compareLegs);
}

/**
 * Deterministic coupon generator. Chooses the leg count itself: the fewest legs (≥ minLegs)
 * that satisfy the goal. One leg per match; saved-coupon matches follow the repeat rule.
 */
export function generateCoupon(legs: readonly Leg[], goal: GeneratorGoal, opts: GeneratorOptions): GenerateResult {
  const fixedLegs = goal.mode === "target" ? goal.legs : undefined;
  const minLegs = fixedLegs ?? opts.minLegs ?? GENERATOR.minLegs;
  const maxLegs = fixedLegs ?? opts.maxLegs ?? GENERATOR.maxLegs;
  if (fixedLegs !== undefined && !(Number.isInteger(fixedLegs) && fixedLegs >= GENERATOR.minLegs && fixedLegs <= GENERATOR.maxLegs)) {
    return { ok: false, error: `Matç sayı ${GENERATOR.minLegs} ilə ${GENERATOR.maxLegs} arasında tam ədəd olmalıdır.` };
  }
  const window = windowFor(goal, opts.targetTolerance ?? GENERATOR.targetTolerance);
  if (typeof window === "string") return { ok: false, error: window };

  const candidates = legs.filter(
    (l) =>
      l.disagreement <= opts.maxDisagreement &&
      l.probability >= (opts.minLegProbability ?? GENERATOR.minLegProbability) &&
      allowedDespiteBlock(l, opts.blocked, opts.repeatAllowedAbove) &&
      (window.minRealOdds === null || l.bestOdds !== null),
  );
  const matchCount = new Set(candidates.map((l) => l.matchId)).size;
  if (matchCount < minLegs) {
    if (fixedLegs !== undefined && matchCount >= GENERATOR.minLegs) {
      return { ok: false, error: `Bu filtrdə yalnız ${matchCount} uyğun matç var — matç sayını azaldın.` };
    }
    return { ok: false, error: "Kifayət qədər uyğun matç yoxdur (saxlanmış kuponların matçları istisna olunub)." };
  }

  const valueMode = window.minRealOdds !== null;
  // Real-odds mode: a coupon beats the minimum only with high-value legs (best price × probability),
  // so the search also tries pools of the highest-value legs.
  const byValue = valueMode
    ? [...candidates].sort((a, b) => b.bestOdds!.price * b.probability - a.bestOdds!.price * a.probability || compareLegs(a, b))
    : [];

  for (let k = minLegs; k <= Math.min(maxLegs, matchCount); k++) {
    let best: GeneratedCoupon | null = null;
    const consider = (picked: Leg[] | null) => {
      if (!picked) return;
      const combined = combine(picked)!;
      const real = realOdds(picked);
      const p = combined.combinedProbability;
      const ok = p >= window.lo && p <= window.hi && (!valueMode || (real !== null && real >= window.minRealOdds!));
      if (ok && (!best || window.rank(p) < window.rank(best.combinedProbability) - 1e-12)) {
        best = { legs: [...picked].sort(compareLegs), ...combined, realOdds: real };
      }
    };

    if (k === 2) {
      // Exact for two legs: every pair from different matches.
      const sorted = [...candidates].sort(compareLegs);
      for (let i = 0; i < sorted.length; i++)
        for (let j = i + 1; j < sorted.length; j++) if (sorted[i]!.matchId !== sorted[j]!.matchId) consider([sorted[i]!, sorted[j]!]);
    } else {
      const pools = valueMode ? [k + 2, 2 * k, 4 * k].map((n) => byValue.slice(0, n)).concat([candidates]) : [candidates];
      for (const pool of pools)
        for (const target of window.targets) for (let safe = 0; safe < k; safe++) consider(pickFor(pool, k, target, valueMode, safe));
    }
    if (best) return { ok: true, coupon: best };
  }
  if (valueMode) {
    return {
      ok: false,
      error:
        "Bu şərtlərə uyğun kupon tapılmadı. Real əmsallar adətən ədalətli əmsaldan bir az aşağıdır (bukmeker marjası) — minimum əmsalı və ya ehtimalı azaldın.",
    };
  }
  if (fixedLegs !== undefined) {
    return {
      ok: false,
      error: `${fixedLegs} matçla bu hədəfə uyğun kupon tapılmadı — hədəfi və ya matç sayını dəyişin (boş buraxsanız sistem özü seçər).`,
    };
  }
  return { ok: false, error: "Bu şərtlərə uyğun kupon tapılmadı. Hədəfi dəyişin." };
}
