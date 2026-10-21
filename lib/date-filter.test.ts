import { describe, expect, it } from "vitest";
import { bakuDay, dateWindow, DEFAULT_DATE_FILTER, inWindow, parseDateFilter, toSearchParams, type DateFilter } from "./date-filter";

const NOW = new Date("2026-10-21T08:00:00Z"); // 12:00 in Baku

describe("parseDateFilter", () => {
  it("defaults to 24h when missing or invalid", () => {
    expect(parseDateFilter({})).toEqual(DEFAULT_DATE_FILTER);
    expect(parseDateFilter({ filtr: "nonsense" })).toEqual({ kind: "24h" });
    expect(parseDateFilter({ filtr: "tarix", tarix: "2026-02-31" })).toEqual({ kind: "24h" });
    expect(parseDateFilter({ filtr: "araliq", bas: "2026-10-22" })).toEqual({ kind: "24h" });
  });

  it("parses every kind and swaps a reversed range", () => {
    expect(parseDateFilter({ filtr: "hefte" })).toEqual({ kind: "week" });
    expect(parseDateFilter({ filtr: "umumi" })).toEqual({ kind: "all" });
    expect(parseDateFilter({ filtr: "tarix", tarix: "2026-10-23" })).toEqual({ kind: "day", date: "2026-10-23" });
    expect(parseDateFilter({ filtr: "araliq", bas: "2026-10-25", son: "2026-10-22" })).toEqual({ kind: "range", from: "2026-10-22", to: "2026-10-25" });
  });

  it("round-trips through the URL", () => {
    const filters: DateFilter[] = [{ kind: "24h" }, { kind: "week" }, { kind: "all" }, { kind: "day", date: "2026-10-23" }, { kind: "range", from: "2026-10-22", to: "2026-10-24" }];
    for (const f of filters) expect(parseDateFilter(Object.fromEntries(new URLSearchParams(toSearchParams(f))))).toEqual(f);
  });
});

describe("dateWindow", () => {
  it("24h and week are relative to now", () => {
    const d = dateWindow({ kind: "24h" }, NOW);
    expect(d.from).toEqual(NOW);
    expect(d.to).toEqual(new Date("2026-10-22T08:00:00Z"));
    expect(dateWindow({ kind: "week" }, NOW).to).toEqual(new Date("2026-10-28T08:00:00Z"));
    expect(dateWindow({ kind: "all" }, NOW).to).toBeNull();
  });

  it("day and range use Asia/Baku midnight", () => {
    expect(dateWindow({ kind: "day", date: "2026-10-23" }, NOW)).toEqual({
      from: new Date("2026-10-22T20:00:00Z"),
      to: new Date("2026-10-23T20:00:00Z"),
    });
    expect(dateWindow({ kind: "range", from: "2026-10-22", to: "2026-10-24" }, NOW).to).toEqual(new Date("2026-10-24T20:00:00Z"));
  });

  it("inWindow: from inclusive, to exclusive", () => {
    const w = dateWindow({ kind: "day", date: "2026-10-23" }, NOW);
    expect(inWindow("2026-10-22T20:00:00Z", w)).toBe(true); // 00:00 Baku
    expect(inWindow("2026-10-23T19:59:00Z", w)).toBe(true); // 23:59 Baku
    expect(inWindow("2026-10-23T20:00:00Z", w)).toBe(false); // next day
  });
});

describe("bakuDay", () => {
  it("uses the Baku calendar day", () => {
    expect(bakuDay(new Date("2026-10-21T19:59:00Z"))).toBe("2026-10-21");
    expect(bakuDay(new Date("2026-10-21T20:00:00Z"))).toBe("2026-10-22");
  });
});
