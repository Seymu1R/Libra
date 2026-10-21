import "server-only";
import { allLegs, allowedDespiteBlock, buildTemplates, type Leg } from "@/lib/templates/build";
import { combine } from "@/lib/templates/combine";
import { SAVED_TEMPLATE_TYPES, TEMPLATES, type SavedTemplateType } from "@/lib/config";
import type { PrismaClient } from "@/generated/prisma/client";
import type { MatchAnalysis } from "@/lib/analysis/types";
import { analyzeSync } from "./analysis.service";

/** Matches (not yet started) used by pending saved coupons — the repeat rule blocks them for new coupons. */
export async function blockedMatchIds(db: PrismaClient, now: Date = new Date()): Promise<Set<string>> {
  const legs = await db.templateLeg.findMany({
    where: {
      template: { type: { in: [...SAVED_TEMPLATE_TYPES] }, status: "PENDING" },
      match: { commenceTime: { gt: now } },
    },
    select: { matchId: true },
  });
  return new Set(legs.map((l) => l.matchId));
}

/** Sabit / Balanslı / Riskli with the configured rules and the saved-coupon repeat rule. Pure — no DB writes. */
export function buildAutoTemplates(analyses: readonly MatchAnalysis[], blocked: ReadonlySet<string>, now: Date) {
  return buildTemplates(analyses, TEMPLATES.rules, {
    maxDisagreement: TEMPLATES.maxDisagreement,
    includeDoubleChance: TEMPLATES.includeDoubleChance,
    now,
    blocked,
    repeatAllowedAbove: TEMPLATES.repeatAllowedAbove,
  });
}

/** Rebuilds the auto templates of a sync from stored data (no API call). Saved templates are kept. */
export async function regenerateTemplates(db: PrismaClient, syncId: string, now: Date = new Date()) {
  const [analyses, blocked] = await Promise.all([analyzeSync(db, syncId), blockedMatchIds(db, now)]);
  const built = buildAutoTemplates(analyses, blocked, now);

  await db.$transaction(async (tx) => {
    await tx.template.deleteMany({ where: { syncId, type: { notIn: [...SAVED_TEMPLATE_TYPES] } } });
    for (const { template } of built) {
      if (!template) continue;
      await tx.template.create({
        data: {
          syncId,
          type: template.type,
          combinedProbability: template.combinedProbability,
          fairOdds: template.fairOdds,
          legs: { create: template.legs.map(legData) },
        },
      });
    }
  });
  return built;
}

export interface CustomLegInput {
  matchId: string;
  market: string;
  selection: string;
}

/**
 * Saves a coupon (manual builder = CUSTOM, generator = GENERATED). Probabilities are recomputed
 * server-side from the stored snapshot, so the client cannot submit arbitrary numbers.
 * Generated coupons must respect the repeat rule; the manual builder is left as before.
 * Auto templates are rebuilt afterwards so they stop using the newly blocked matches.
 */
export async function saveCustomTemplate(
  db: PrismaClient,
  syncId: string,
  picks: readonly CustomLegInput[],
  now: Date = new Date(),
  type: SavedTemplateType = "CUSTOM",
) {
  if (picks.length === 0) throw new Error("Ən azı bir seçim lazımdır.");
  if (new Set(picks.map((p) => p.matchId)).size !== picks.length) {
    throw new Error("Bir matçdan yalnız bir seçim ola bilər.");
  }
  const available = allLegs(await analyzeSync(db, syncId), now);
  const legs = picks.map((p) => {
    const leg = available.find((l) => l.matchId === p.matchId && l.market === p.market && l.selection === p.selection);
    if (!leg) throw new Error(`Seçim tapılmadı və ya matç artıq başlayıb: ${p.matchId} ${p.market} ${p.selection}`);
    return leg;
  });
  if (type === "GENERATED") {
    const blocked = await blockedMatchIds(db, now);
    const repeated = legs.find((l) => !allowedDespiteBlock(l, blocked, TEMPLATES.repeatAllowedAbove));
    if (repeated) throw new Error(`${repeated.homeTeam} — ${repeated.awayTeam} artıq saxlanmış kupondadır.`);
  }
  const combined = combine(legs)!;
  const created = await db.template.create({
    data: { syncId, type, ...combined, legs: { create: legs.map(legData) } },
  });
  await regenerateTemplates(db, syncId, now);
  return created;
}

function legData(l: Leg) {
  return {
    matchId: l.matchId,
    market: l.market,
    selection: l.selection,
    probability: l.probability,
    bookmakerCount: l.bookmakerCount,
  };
}

/** Auto templates of this sync + every saved coupon (saved ones outlive the sync they were made in). */
export async function listTemplates(db: PrismaClient, syncId: string) {
  return db.template.findMany({
    where: { OR: [{ syncId }, { type: { in: [...SAVED_TEMPLATE_TYPES] } }] },
    include: { legs: { include: { match: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/** Deletes a saved coupon; its matches become available again for the auto templates of `syncId`. */
export async function deleteCustomTemplate(db: PrismaClient, id: string, syncId?: string, now: Date = new Date()) {
  await db.template.deleteMany({ where: { id, type: { in: [...SAVED_TEMPLATE_TYPES] } } });
  if (syncId) await regenerateTemplates(db, syncId, now);
}
