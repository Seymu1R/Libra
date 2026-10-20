import { DISPLAY } from "./config";

// Only numeric parts are taken from Intl and assembled by hand: az-AZ locale data differs between
// Node and browsers, which would give inconsistent output and hydration mismatches.
const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY.timeZone,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Formats a UTC instant in Asia/Baku, e.g. "21.10.2026 19:45". */
export function formatBaku(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const p = Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** ISO 8601 without milliseconds — the format the API docs show (2023-09-09T00:00:00Z). */
export function toApiIso(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}
