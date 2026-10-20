import "server-only";
import { allLegs, buildTemplates, type Leg } from "@/lib/templates/build";
import { combine } from "@/lib/templates/combine";
import { TEMPLATES } from "@/lib/config";
import type { PrismaClient } from "@/generated/prisma/client";
import { analyzeSync } from "./analysis.service";

/** Rebuilds the auto templates of a sync from stored data (no API call). Custom templates are kept. */
export async function regenerateTemplates(db: PrismaClient, syncId: string, now: Date = new Date()) {
  const analyses = await analyzeSync(db, syncId);
  const built = buildTemplates(analyses, TEMPLATES.rules, {
    maxDisagreement: TEMPLATES.maxDisagreement,
    includeDoubleChance: TEMPLATES.includeDoubleChance,
    now,
  });

  await db.$transaction(async (tx) => {
    await tx.template.deleteMany({ where: { syncId, type: { not: "CUSTOM" } } });
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
 * Saves a custom template. Probabilities are recomputed server-side from the stored snapshot,
 * so the client cannot submit arbitrary numbers.
 */
export async function saveCustomTemplate(db: PrismaClient, syncId: string, picks: readonly CustomLegInput[], now: Date = new Date()) {
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
  const combined = combine(legs)!;
  return db.template.create({
    data: { syncId, type: "CUSTOM", ...combined, legs: { create: legs.map(legData) } },
  });
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

export async function listTemplates(db: PrismaClient, syncId: string) {
  return db.template.findMany({
    where: { syncId },
    include: { legs: { include: { match: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteCustomTemplate(db: PrismaClient, id: string) {
  await db.template.deleteMany({ where: { id, type: "CUSTOM" } });
}
