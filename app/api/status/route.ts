import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getStatus } from "@/server/status.service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getStatus(db));
}
