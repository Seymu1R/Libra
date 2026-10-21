import "server-only";
import { analyzeMatches } from "@/lib/analysis/analyze";
import type { MatchAnalysis, MatchInput } from "@/lib/analysis/types";
import { ANALYSIS } from "@/lib/config";
import type { PrismaClient } from "@/generated/prisma/client";

/** Latest sync that stored data (success or partial). Analysis never calls the API. */
export async function latestDataSync(db: PrismaClient) {
  return db.sync.findFirst({
    where: { status: { in: ["success", "partial"] } },
    orderBy: { startedAt: "desc" },
  });
}

export async function analyzeSync(db: PrismaClient, syncId: string): Promise<MatchAnalysis[]> {
  const rows = await db.oddsSnapshot.findMany({
    where: { syncId },
    include: { match: true },
    orderBy: { id: "asc" },
  });

  const byMatch = new Map<string, MatchInput>();
  for (const r of rows) {
    let input = byMatch.get(r.matchId);
    if (!input) {
      input = {
        id: r.match.id,
        competition: r.match.competition,
        homeTeam: r.match.homeTeam,
        awayTeam: r.match.awayTeam,
        commenceTime: r.match.commenceTime.toISOString(),
        prices: [],
      };
      byMatch.set(r.matchId, input);
    }
    input.prices.push({
      bookmaker: r.bookmaker,
      bookmakerTitle: r.bookmakerTitle,
      market: r.market,
      outcome: r.outcome,
      point: r.point,
      price: r.price,
    });
  }

  return analyzeMatches([...byMatch.values()], {
    minBookmakers: ANALYSIS.minBookmakers,
    totalsMarkets: ANALYSIS.totalsMarkets,
  });
}
