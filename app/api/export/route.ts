import { db } from "@/server/db";
import { buildTable, toXlsx } from "@/server/export.service";
import { EXPORT_TABLES, exportFileName, isExportTableKey, toCsv } from "@/lib/export/tables";

export const dynamic = "force-dynamic";

/** GET /api/export?format=xlsx → all tables in one workbook · ?format=csv&table=<key> → one table. Reads the DB only. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const now = new Date();

  if (params.get("format") === "xlsx") {
    const tables = await Promise.all(EXPORT_TABLES.map((t) => buildTable(db, t.key)));
    return download(
      new Uint8Array(await toXlsx(tables)),
      `${exportFileName("data", now)}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  }

  const table = params.get("table") ?? "";
  if (params.get("format") !== "csv" || !isExportTableKey(table)) {
    return Response.json({ error: "Yanlış sorğu: format=xlsx və ya format=csv&table=<cədvəl>." }, { status: 400 });
  }
  return download(toCsv(await buildTable(db, table)), `${exportFileName(table, now)}.csv`, "text/csv; charset=utf-8");
}

function download(body: BodyInit, fileName: string, contentType: string) {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
