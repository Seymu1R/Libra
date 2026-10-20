import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import { latestRemainingCredits } from "./api-call-log";
import { isMockMode } from "./odds-client";
import { getCooldownUntil, isSyncRunning, parseCompetitionResults } from "./sync.service";

export async function getStatus(db: PrismaClient) {
  const mock = isMockMode();
  const now = new Date();
  const [last, cooldownUntil, running, creditsRemaining] = await Promise.all([
    db.sync.findFirst({ where: { status: { not: "running" } }, orderBy: { startedAt: "desc" } }),
    getCooldownUntil(db, mock, now),
    isSyncRunning(db, now),
    latestRemainingCredits(),
  ]);
  return {
    mock,
    running,
    cooldownUntil: cooldownUntil?.toISOString() ?? null,
    creditsRemaining,
    lastSync: last
      ? {
          id: last.id,
          startedAt: last.startedAt.toISOString(),
          status: last.status,
          mock: last.mock,
          creditsUsed: last.creditsUsed,
          results: parseCompetitionResults(last.competitionResults),
        }
      : null,
  };
}

export type AppStatus = Awaited<ReturnType<typeof getStatus>>;
