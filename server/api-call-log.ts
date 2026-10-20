import "server-only";
import { db } from "./db";
import type { CallLog } from "./odds-client";

export async function recordApiCall(log: CallLog): Promise<void> {
  await db.apiCallLog.create({
    data: {
      endpoint: log.endpoint,
      httpStatus: log.httpStatus,
      requestsRemaining: log.quota.remaining,
      requestsUsed: log.quota.used,
      requestsLast: log.quota.last,
    },
  });
}

/** Latest known remaining credits across all logged calls. */
export async function latestRemainingCredits(): Promise<number | null> {
  const row = await db.apiCallLog.findFirst({
    where: { requestsRemaining: { not: null } },
    orderBy: { at: "desc" },
  });
  return row?.requestsRemaining ?? null;
}
