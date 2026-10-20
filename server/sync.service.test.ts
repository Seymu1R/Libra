import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { createTestDb } from "@/test/test-db";
import { analyzeSync } from "./analysis.service";
import { MockOddsClient, OddsApiError, type OddsClient } from "./odds-client";
import { getCooldownUntil, parseCompetitionResults, runSync, SyncBlockedError } from "./sync.service";
import { listTemplates, regenerateTemplates, saveCustomTemplate } from "./templates.service";

const NOW = new Date("2026-10-20T12:00:00Z");
let db: PrismaClient;
let cleanup: () => Promise<void>;

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
});
afterEach(async () => cleanup());

const mock = () => new MockOddsClient(() => NOW);

/** Mock client that pretends to be the real API (mock=false → real cooldown) and reports quota. */
function paidClient(failKey?: string): OddsClient {
  const inner = mock();
  const quota = { remaining: 480, used: 20, last: 2 };
  return {
    mock: false,
    getSports: () => inner.getSports(),
    getEvents: async (k, w) => ({ ...(await inner.getEvents(k, w)), quota: { ...quota, last: 0 } }),
    getOdds: async (k, w) => {
      if (k === failKey) throw new OddsApiError(500, "boom");
      return { ...(await inner.getOdds(k, w)), quota };
    },
  };
}

describe("runSync", () => {
  it("stores a snapshot of upcoming matches only", async () => {
    const sync = await runSync(["soccer_epl"], { db, client: mock(), now: () => NOW });
    expect(sync.status).toBe("success");
    const [result] = parseCompetitionResults(sync.competitionResults);
    // fixture has 5 regular matches + 1 already started + 1 beyond 7 days
    expect(result).toMatchObject({ key: "soccer_epl", status: "success", matches: 5 });
    expect(await db.match.count()).toBe(5);
    expect(await db.oddsSnapshot.count({ where: { syncId: sync.id } })).toBeGreaterThan(100);
  });

  it("isolates a failing competition and marks the sync partial", async () => {
    const sync = await runSync(["soccer_epl", "soccer_italy_serie_a"], {
      db,
      client: paidClient("soccer_epl"),
      now: () => NOW,
    });
    expect(sync.status).toBe("partial");
    const results = parseCompetitionResults(sync.competitionResults);
    expect(results.find((r) => r.key === "soccer_epl")).toMatchObject({ status: "failed", error: "boom" });
    expect(results.find((r) => r.key === "soccer_italy_serie_a")?.status).toBe("success");
    expect(sync.creditsUsed).toBe(2);
    expect(sync.creditsRemaining).toBe(480);
  });

  it("blocks a second real sync inside the cooldown window", async () => {
    const client = paidClient();
    await runSync(["soccer_epl"], { db, client, now: () => NOW });
    const later = new Date(NOW.getTime() + 10 * 60_000);
    await expect(runSync(["soccer_epl"], { db, client, now: () => later })).rejects.toBeInstanceOf(SyncBlockedError);
    expect(await getCooldownUntil(db, false, later)).toEqual(new Date(NOW.getTime() + 30 * 60_000));
    const afterCooldown = new Date(NOW.getTime() + 31 * 60_000);
    await expect(runSync(["soccer_epl"], { db, client, now: () => afterCooldown })).resolves.toBeTruthy();
  });

  it("rejects unknown competition keys", async () => {
    await expect(runSync(["soccer_made_up"], { db, client: mock(), now: () => NOW })).rejects.toThrow(/Naməlum/);
  });
});

describe("analysis + templates on stored data", () => {
  it("skips thin matches and builds deterministic templates", async () => {
    const sync = await runSync(undefined, { db, client: mock(), now: () => NOW });
    const analyses = await analyzeSync(db, sync.id);
    expect(analyses.some((a) => a.skipped)).toBe(true); // fixture match with 6 bookmakers
    expect(analyses.filter((a) => !a.skipped).length).toBeGreaterThan(10);

    const first = await regenerateTemplates(db, sync.id, NOW);
    const second = await regenerateTemplates(db, sync.id, NOW);
    expect(second).toEqual(first);

    const stored = await listTemplates(db, sync.id);
    expect(stored.map((t) => t.type).sort()).toEqual(["BALANSLI", "RISKLI", "SABIT"]);
    for (const t of stored) {
      expect(new Set(t.legs.map((l) => l.matchId)).size).toBe(t.legs.length);
      expect(t.fairOdds).toBeCloseTo(1 / t.combinedProbability, 9);
    }
  });

  it("saves custom templates with server-side probabilities and keeps them on regenerate", async () => {
    const sync = await runSync(["soccer_epl"], { db, client: mock(), now: () => NOW });
    const match = (await analyzeSync(db, sync.id)).find((a) => !a.skipped)!;
    const saved = await saveCustomTemplate(db, sync.id, [{ matchId: match.id, market: "1X2", selection: "HOME" }], NOW);
    expect(saved.combinedProbability).toBeCloseTo(match.markets[0]!.selections[0]!.probability, 12);

    await regenerateTemplates(db, sync.id, NOW);
    expect((await listTemplates(db, sync.id)).some((t) => t.type === "CUSTOM")).toBe(true);

    await expect(
      saveCustomTemplate(db, sync.id, [
        { matchId: match.id, market: "1X2", selection: "HOME" },
        { matchId: match.id, market: "DC", selection: "1X" },
      ], NOW),
    ).rejects.toThrow(/yalnız bir/);
  });
});
