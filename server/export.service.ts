import "server-only";
import ExcelJS from "exceljs";
import type { PrismaClient } from "@/generated/prisma/client";
import { DISPLAY } from "@/lib/config";
import { apiCallTable, matchTable, oddsTable, probabilityTable, syncTable, type ExportTableKey, type Table } from "@/lib/export/tables";
import { analyzeSync, latestDataSync } from "./analysis.service";

/** Builds one export table from the database (read-only; never calls the API). */
export async function buildTable(db: PrismaClient, key: ExportTableKey): Promise<Table> {
  switch (key) {
    case "emsallar": {
      const rows = await db.oddsSnapshot.findMany({
        include: { match: true, sync: { select: { startedAt: true } } },
        orderBy: [{ sync: { startedAt: "desc" } }, { match: { commenceTime: "asc" } }, { matchId: "asc" }, { id: "asc" }],
      });
      return oddsTable(rows.map((r) => ({ ...r, syncStartedAt: r.sync.startedAt })));
    }
    case "ehtimallar": {
      const sync = await latestDataSync(db);
      return probabilityTable(sync ? await analyzeSync(db, sync.id) : [], sync?.startedAt ?? new Date(0));
    }
    case "matclar":
      return matchTable(await db.match.findMany({ orderBy: [{ commenceTime: "asc" }, { id: "asc" }] }));
    case "sinxronlar": {
      const syncs = await db.sync.findMany({ orderBy: { startedAt: "desc" } });
      const counts = await db.oddsSnapshot.groupBy({ by: ["syncId"], _count: { _all: true } });
      const matchCounts = await db.oddsSnapshot.groupBy({ by: ["syncId", "matchId"] });
      return syncTable(
        syncs.map((s) => ({
          ...s,
          prices: counts.find((c) => c.syncId === s.id)?._count._all ?? 0,
          matches: matchCounts.filter((c) => c.syncId === s.id).length,
        })),
      );
    }
    case "api":
      return apiCallTable(await db.apiCallLog.findMany({ orderBy: { at: "desc" } }));
  }
}

// Excel has no time zones: dates are written as Asia/Baku wall-clock time.
const offsetMs = (() => {
  const [, sign, h, m] = /^([+-])(\d{2}):(\d{2})$/.exec(DISPLAY.utcOffset)!;
  return (sign === "-" ? -1 : 1) * (Number(h) * 60 + Number(m)) * 60_000;
})();

const NUM_FMT = { date: "dd.mm.yyyy hh:mm", percent: "0.00%", number: "0.####", text: "@" } as const;

/** One workbook, one sheet per table: bold frozen header, filters, column widths and number formats. */
export async function toXlsx(tables: readonly Table[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Tərəzi";
  for (const t of tables) {
    const ws = wb.addWorksheet(t.title, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = t.columns.map((c) => ({ header: c.header, width: c.width, style: c.type === "text" ? {} : { numFmt: NUM_FMT[c.type] } }));
    ws.getRow(1).font = { bold: true };
    for (const row of t.rows) ws.addRow(row.map((cell) => (cell instanceof Date ? new Date(cell.getTime() + offsetMs) : cell)));
    if (t.columns.length > 0) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: t.columns.length } };
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
