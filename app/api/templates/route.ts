import { NextResponse } from "next/server";
import { z } from "zod";
import { latestDataSync } from "@/server/analysis.service";
import { db } from "@/server/db";
import { regenerateTemplates } from "@/server/templates.service";

const bodySchema = z.object({ syncId: z.string().optional() });

/** Rebuilds auto templates from stored data — never calls the odds API. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Yanlış sorğu." }, { status: 400 });
  const syncId = parsed.data.syncId ?? (await latestDataSync(db))?.id;
  if (!syncId) return NextResponse.json({ error: "Hələ heç bir sinxronizasiya yoxdur." }, { status: 404 });
  const built = await regenerateTemplates(db, syncId);
  return NextResponse.json({ syncId, generated: built.filter((b) => b.template).length });
}
