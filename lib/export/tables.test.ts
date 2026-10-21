import { describe, expect, it } from "vitest";
import { exportFileName, isExportTableKey, oddsTable, toCsv, type OddsRow, type Table } from "./tables";

const match = {
  id: "m1",
  competition: "soccer_epl",
  homeTeam: "Arsenal",
  awayTeam: "Chelsea",
  commenceTime: new Date("2026-10-21T19:00:00Z"),
};
const sync = new Date("2026-10-21T08:00:00Z");
const row = (market: string, outcome: string, price: number, point: number | null = null): OddsRow => ({
  syncStartedAt: sync,
  match,
  bookmaker: "b",
  bookmakerTitle: "Book",
  market,
  outcome,
  point,
  price,
});

describe("oddsTable", () => {
  it("maps API outcomes to our selections", () => {
    const t = oddsTable([row("h2h", "Arsenal", 2), row("h2h", "Draw", 3.4), row("h2h", "Chelsea", 4), row("totals", "Over", 1.9, 3.5)]);
    expect(t.rows.map((r) => [r[6], r[7]])).toEqual([
      ["Qalib / 1X2", "1"],
      ["Qalib / 1X2", "X"],
      ["Qalib / 1X2", "2"],
      ["Üst/Alt", "Üst 3.5"],
    ]);
    expect(t.rows[0]![1]).toBe("Premyer Liqa (İngiltərə)");
    expect(oddsTable([row("spreads", "Chelsea", 1.9, 4.5), row("spreads", "Arsenal", 1.9, -4.5)]).rows.map((r) => r[7])).toEqual([
      "2 +4.5",
      "1 -4.5",
    ]);
  });
});

describe("toCsv", () => {
  const table: Table = {
    key: "matclar",
    title: "Matçlar",
    columns: [
      { header: "Ad", type: "text", width: 10 },
      { header: "Vaxt", type: "date", width: 10 },
      { header: "Ehtimal", type: "percent", width: 10 },
      { header: "Əmsal", type: "number", width: 10 },
    ],
    rows: [
      ['Qəbələ, "FK"', sync, 0.48275, 2.3076517],
      ["Boş", null, null, null],
    ],
  };

  it("BOM, quoting, Baku times, percents 0–100, rounded numbers", () => {
    const csv = toCsv(table);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual([
      "Ad,Vaxt,Ehtimal (%),Əmsal",
      '"Qəbələ, ""FK""",21.10.2026 12:00,48.27,2.3077',
      "Boş,,,",
      "",
    ]);
  });
});

describe("helpers", () => {
  it("file names use Baku time; table keys are validated", () => {
    expect(exportFileName("emsallar", new Date("2026-10-21T20:30:00Z"))).toBe("terezi-emsallar-2026-10-22-0030");
    expect(isExportTableKey("emsallar")).toBe(true);
    expect(isExportTableKey("../etc")).toBe(false);
  });
});
