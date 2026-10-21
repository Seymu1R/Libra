import type { MatchAnalysis } from "../analysis/types";
import { competitionName } from "../config";
import { describeSelection, MARKET_LABEL, selectionLabel, SYNC_STATUS_LABEL } from "../labels";
import { formatBaku } from "../time";

/** text · number · percent (0–1) · date (UTC instant, shown in Asia/Baku). */
export type ColumnType = "text" | "number" | "percent" | "date";
export type Cell = string | number | Date | null;

export interface Column {
  header: string;
  type: ColumnType;
  width: number;
}

export interface Table {
  /** File / sheet key, e.g. "emsallar". */
  key: ExportTableKey;
  /** Sheet name (≤ 31 chars). */
  title: string;
  columns: Column[];
  rows: Cell[][];
}

export const EXPORT_TABLES = [
  { key: "emsallar", title: "Əmsallar", description: "Xam API datası — hər bukmekerin hər əmsalı, bütün sinxronlar" },
  { key: "ehtimallar", title: "Ehtimallar", description: "Son sinxronun konsensus ehtimalları" },
  { key: "matclar", title: "Matçlar", description: "Bütün matçlar" },
  { key: "sinxronlar", title: "Sinxronlar", description: "Hər sinxron: vaxt, status, kredit" },
  { key: "api", title: "API çağırışları", description: "Hər API sorğusu və kredit" },
] as const;
export type ExportTableKey = (typeof EXPORT_TABLES)[number]["key"];
export const isExportTableKey = (v: string): v is ExportTableKey => EXPORT_TABLES.some((t) => t.key === v);

const col = (header: string, type: ColumnType = "text", width = 14): Column => ({ header, type, width });
const titleOf = (key: ExportTableKey) => EXPORT_TABLES.find((t) => t.key === key)!.title;

// ---- input shapes (plain data, mirrors the Prisma rows the server reads) ----

export interface MatchRow {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: Date;
}
export interface OddsRow {
  syncStartedAt: Date;
  match: MatchRow;
  bookmaker: string;
  bookmakerTitle: string;
  market: string;
  outcome: string;
  point: number | null;
  price: number;
}
export interface SyncRow {
  startedAt: Date;
  finishedAt: Date | null;
  status: string;
  mock: boolean;
  creditsUsed: number;
  creditsRemaining: number | null;
  matches: number;
  prices: number;
}
export interface ApiCallRow {
  at: Date;
  endpoint: string;
  httpStatus: number;
  requestsLast: number | null;
  requestsUsed: number | null;
  requestsRemaining: number | null;
}

const API_MARKET: Record<string, string> = { h2h: "1X2", totals: "Üst/Alt" };

/** API outcome → our selection label: team name → 1 / 2, "Draw" → X, Over/Under → Üst/Alt <line>. */
function outcomeLabel(r: OddsRow): string {
  if (r.market === "h2h")
    return r.outcome === r.match.homeTeam ? "1" : r.outcome === r.match.awayTeam ? "2" : r.outcome === "Draw" ? "X" : r.outcome;
  if (r.market === "totals") return `${r.outcome === "Over" ? "Üst" : r.outcome === "Under" ? "Alt" : r.outcome} ${r.point ?? ""}`.trim();
  return r.outcome;
}

export function oddsTable(rows: readonly OddsRow[]): Table {
  return {
    key: "emsallar",
    title: titleOf("emsallar"),
    columns: [
      col("Sinxron", "date", 17),
      col("Turnir", "text", 24),
      col("Matç başlanğıcı", "date", 17),
      col("Ev sahibi", "text", 22),
      col("Qonaq", "text", 22),
      col("Bukmeker", "text", 18),
      col("Bazar", "text", 9),
      col("Seçim", "text", 9),
      col("API nəticəsi", "text", 20),
      col("Xətt", "number", 7),
      col("Əmsal", "number", 8),
      col("Matç ID", "text", 34),
    ],
    rows: rows.map((r) => [
      r.syncStartedAt,
      competitionName(r.match.competition),
      r.match.commenceTime,
      r.match.homeTeam,
      r.match.awayTeam,
      r.bookmakerTitle,
      API_MARKET[r.market] ?? r.market,
      outcomeLabel(r),
      r.outcome,
      r.point,
      r.price,
      r.match.id,
    ]),
  };
}

export function probabilityTable(analyses: readonly MatchAnalysis[], syncStartedAt: Date): Table {
  const rows: Cell[][] = [];
  for (const a of analyses) {
    for (const m of a.markets) {
      for (const s of m.selections) {
        rows.push([
          syncStartedAt,
          competitionName(a.competition),
          new Date(a.commenceTime),
          a.homeTeam,
          a.awayTeam,
          MARKET_LABEL[m.market],
          selectionLabel(m.market, s.selection),
          describeSelection(m.market, s.selection, a.homeTeam, a.awayTeam),
          s.probability,
          s.fairOdds,
          s.bestOdds?.price ?? null,
          s.bestOdds?.bookmakerTitle ?? null,
          s.bookmakerCount,
          s.disagreement,
        ]);
      }
    }
  }
  return {
    key: "ehtimallar",
    title: titleOf("ehtimallar"),
    columns: [
      col("Sinxron", "date", 17),
      col("Turnir", "text", 24),
      col("Matç başlanğıcı", "date", 17),
      col("Ev sahibi", "text", 22),
      col("Qonaq", "text", 22),
      col("Bazar", "text", 13),
      col("Seçim", "text", 9),
      col("Təsvir", "text", 28),
      col("Ehtimal", "percent", 9),
      col("Ədalətli əmsal", "number", 10),
      col("Ən yaxşı əmsal", "number", 10),
      col("Ən yaxşı bukmeker", "text", 18),
      col("Bukmeker sayı", "number", 9),
      col("Fikir ayrılığı", "percent", 9),
    ],
    rows,
  };
}

export function matchTable(rows: readonly MatchRow[]): Table {
  return {
    key: "matclar",
    title: titleOf("matclar"),
    columns: [
      col("Turnir", "text", 24),
      col("Başlanğıc", "date", 17),
      col("Ev sahibi", "text", 22),
      col("Qonaq", "text", 22),
      col("Matç ID", "text", 34),
    ],
    rows: rows.map((m) => [competitionName(m.competition), m.commenceTime, m.homeTeam, m.awayTeam, m.id]),
  };
}

export function syncTable(rows: readonly SyncRow[]): Table {
  return {
    key: "sinxronlar",
    title: titleOf("sinxronlar"),
    columns: [
      col("Başladı", "date", 17),
      col("Bitdi", "date", 17),
      col("Status", "text", 10),
      col("Test məlumatı", "text", 8),
      col("İstifadə olunan kredit", "number", 10),
      col("Qalan kredit", "number", 10),
      col("Matç", "number", 7),
      col("Əmsal sətri", "number", 9),
    ],
    rows: rows.map((s) => [
      s.startedAt,
      s.finishedAt,
      SYNC_STATUS_LABEL[s.status] ?? s.status,
      s.mock ? "bəli" : "xeyr",
      s.creditsUsed,
      s.creditsRemaining,
      s.matches,
      s.prices,
    ]),
  };
}

export function apiCallTable(rows: readonly ApiCallRow[]): Table {
  return {
    key: "api",
    title: titleOf("api"),
    columns: [
      col("Vaxt", "date", 17),
      col("Endpoint", "text", 44),
      col("HTTP", "number", 6),
      col("Kredit (bu sorğu)", "number", 9),
      col("İstifadə olunub", "number", 9),
      col("Qalan", "number", 8),
    ],
    rows: rows.map((r) => [r.at, r.endpoint, r.httpStatus, r.requestsLast, r.requestsUsed, r.requestsRemaining]),
  };
}

// ---- CSV ----

function csvValue(cell: Cell, type: ColumnType): string {
  if (cell === null) return "";
  let text: string;
  if (cell instanceof Date) text = formatBaku(cell);
  else if (typeof cell === "number") text = type === "percent" ? (cell * 100).toFixed(2) : String(Number(cell.toFixed(4)));
  else text = cell;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180 CSV with a UTF-8 BOM (so Excel reads Azerbaijani letters); percents as 0–100, times in Asia/Baku. */
export function toCsv(table: Table): string {
  const header = table.columns.map((c) => csvValue(c.type === "percent" ? `${c.header} (%)` : c.header, "text"));
  const lines = [header.join(","), ...table.rows.map((row) => row.map((cell, i) => csvValue(cell, table.columns[i]!.type)).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** "terezi-emsallar-2026-10-21-1530" (Asia/Baku). */
export function exportFileName(name: string, now: Date): string {
  const [date, time] = formatBaku(now).split(" ");
  const [d, m, y] = date!.split(".");
  return `terezi-${name}-${y}-${m}-${d}-${time!.replace(":", "")}`;
}
