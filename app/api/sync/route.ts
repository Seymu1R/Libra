import { NextResponse } from "next/server";
import { z } from "zod";
import { recordApiCall } from "@/server/api-call-log";
import { db } from "@/server/db";
import { createOddsClient, OddsApiError } from "@/server/odds-client";
import { parseCompetitionResults, runSync, SyncBlockedError } from "@/server/sync.service";
import { regenerateTemplates } from "@/server/templates.service";

const bodySchema = z.object({ competitions: z.array(z.string()).optional() });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Yanlış sorğu." }, { status: 400 });

  try {
    const client = createOddsClient(recordApiCall);
    const sync = await runSync(parsed.data.competitions, { db, client });
    if (sync.status !== "failed") await regenerateTemplates(db, sync.id);
    return NextResponse.json({
      id: sync.id,
      status: sync.status,
      creditsUsed: sync.creditsUsed,
      creditsRemaining: sync.creditsRemaining,
      results: parseCompetitionResults(sync.competitionResults),
    });
  } catch (err) {
    if (err instanceof SyncBlockedError) {
      return NextResponse.json({ error: err.message, retryAt: err.retryAt?.toISOString() ?? null }, { status: 429 });
    }
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    const status = err instanceof OddsApiError ? 502 : message.startsWith("Naməlum turnir") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
