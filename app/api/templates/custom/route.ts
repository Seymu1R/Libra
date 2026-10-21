import { NextResponse } from "next/server";
import { z } from "zod";
import { SAVED_TEMPLATE_TYPES } from "@/lib/config";
import { latestDataSync } from "@/server/analysis.service";
import { db } from "@/server/db";
import { deleteCustomTemplate, saveCustomTemplate } from "@/server/templates.service";

const bodySchema = z.object({
  syncId: z.string(),
  legs: z.array(z.object({ matchId: z.string(), market: z.string(), selection: z.string() })).min(1),
  type: z.enum(SAVED_TEMPLATE_TYPES).default("CUSTOM"),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Yanlış sorğu." }, { status: 400 });
  try {
    const t = await saveCustomTemplate(db, parsed.data.syncId, parsed.data.legs, new Date(), parsed.data.type);
    return NextResponse.json({ id: t.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Xəta" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id lazımdır." }, { status: 400 });
  await deleteCustomTemplate(db, id, (await latestDataSync(db))?.id);
  return NextResponse.json({ ok: true });
}
