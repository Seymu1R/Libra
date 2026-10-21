import "server-only";
import { COMPETITION_KEYS, SYNC } from "@/lib/config";
import { addDays } from "@/lib/time";
import type { PrismaClient } from "@/generated/prisma/client";
import type { OddsClient } from "./odds-client";

export interface CompetitionResult {
  key: string;
  /** success: odds stored · empty: no matches in window (no credits spent) · failed: error */
  status: "success" | "empty" | "failed";
  matches: number;
  credits: number;
  error?: string;
}

export interface SyncDeps {
  db: PrismaClient;
  client: OddsClient;
  now?: () => Date;
}

export class SyncBlockedError extends Error {
  constructor(
    readonly reason: "running" | "cooldown",
    readonly retryAt: Date | null,
    message: string,
  ) {
    super(message);
    this.name = "SyncBlockedError";
  }
}

/** A "running" sync older than this is treated as crashed and does not block. */
const STALE_RUNNING_MS = 10 * 60_000;

export function cooldownMinutes(mock: boolean): number {
  return mock ? SYNC.mockCooldownMinutes : SYNC.cooldownMinutes;
}

/** Cooldown counts from the last sync that stored data; mock and real syncs are tracked separately. */
export async function getCooldownUntil(db: PrismaClient, mock: boolean, now: Date = new Date()): Promise<Date | null> {
  const last = await db.sync.findFirst({
    where: { status: { in: ["success", "partial"] }, mock },
    orderBy: { startedAt: "desc" },
  });
  if (!last) return null;
  const until = new Date(last.startedAt.getTime() + cooldownMinutes(mock) * 60_000);
  return until > now ? until : null;
}

export async function isSyncRunning(db: PrismaClient, now: Date = new Date()): Promise<boolean> {
  const running = await db.sync.findFirst({
    where: { status: "running", startedAt: { gt: new Date(now.getTime() - STALE_RUNNING_MS) } },
  });
  return running !== null;
}

async function assertCanSync(deps: SyncDeps, now: Date): Promise<void> {
  if (await isSyncRunning(deps.db, now)) throw new SyncBlockedError("running", null, "Sinxronizasiya artıq gedir.");

  const until = await getCooldownUntil(deps.db, deps.client.mock, now);
  if (until) {
    const minutes = Math.ceil((until.getTime() - now.getTime()) / 60_000);
    throw new SyncBlockedError("cooldown", until, `Növbəti sinxronizasiya ${minutes} dəqiqə sonra mümkündür.`);
  }
}

export function resolveCompetitions(requested: readonly string[] | undefined): string[] {
  if (!requested || requested.length === 0) return [...COMPETITION_KEYS];
  const unknown = requested.filter((k) => !COMPETITION_KEYS.includes(k as never));
  if (unknown.length > 0) throw new Error(`Naməlum turnir açarı: ${unknown.join(", ")}`);
  return COMPETITION_KEYS.filter((k) => requested.includes(k));
}

export async function runSync(requested: readonly string[] | undefined, deps: SyncDeps) {
  const { db, client } = deps;
  const now = (deps.now ?? (() => new Date()))();
  const competitions = resolveCompetitions(requested);
  await assertCanSync(deps, now);

  const sync = await db.sync.create({ data: { status: "running", mock: client.mock, startedAt: now } });
  const window = { from: now, to: addDays(now, SYNC.daysAhead) };
  const results: CompetitionResult[] = [];
  let creditsRemaining: number | null = null;

  // Sequential on purpose: gentle on the rate limit (429) and keeps credit accounting simple.
  for (const key of competitions) {
    let credits = 0;
    try {
      const events = await client.getEvents(key, window); // free
      creditsRemaining = events.quota.remaining ?? creditsRemaining;
      const upcoming = events.data.filter((e) => new Date(e.commence_time) > now);
      if (upcoming.length === 0) {
        results.push({ key, status: "empty", matches: 0, credits: 0 });
        continue;
      }

      const odds = await client.getOdds(key, window); // paid
      credits = odds.quota.last ?? 0;
      creditsRemaining = odds.quota.remaining ?? creditsRemaining;

      const matches = odds.data.filter((e) => {
        const t = new Date(e.commence_time);
        return t > now && t <= window.to;
      });

      await db.$transaction(async (tx) => {
        for (const e of matches) {
          const data = {
            competition: key,
            homeTeam: e.home_team,
            awayTeam: e.away_team,
            commenceTime: new Date(e.commence_time),
          };
          await tx.match.upsert({ where: { id: e.id }, create: { id: e.id, ...data }, update: data });
          const rows = e.bookmakers.flatMap((b) =>
            b.markets
              .filter((m) => m.key === "h2h" || m.key === "totals" || m.key === "spreads")
              .flatMap((m) =>
                m.outcomes.map((o) => ({
                  syncId: sync.id,
                  matchId: e.id,
                  bookmaker: b.key,
                  bookmakerTitle: b.title,
                  market: m.key,
                  outcome: o.name,
                  point: o.point ?? null,
                  price: o.price,
                })),
              ),
          );
          if (rows.length > 0) await tx.oddsSnapshot.createMany({ data: rows });
        }
      });

      results.push({ key, status: "success", matches: matches.length, credits });
    } catch (err) {
      results.push({ key, status: "failed", matches: 0, credits, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const failed = results.filter((r) => r.status === "failed").length;
  const status = failed === 0 ? "success" : failed === results.length ? "failed" : "partial";

  return db.sync.update({
    where: { id: sync.id },
    data: {
      status,
      finishedAt: new Date(),
      creditsUsed: results.reduce((a, r) => a + r.credits, 0),
      creditsRemaining,
      competitionResults: JSON.stringify(results),
    },
  });
}

export function parseCompetitionResults(json: string): CompetitionResult[] {
  try {
    return JSON.parse(json) as CompetitionResult[];
  } catch {
    return [];
  }
}
