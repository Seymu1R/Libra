import { DISPLAY } from "./config";
import { addDays } from "./time";

/**
 * Coupon date filter (Kuponlar page). Windows are on match kick-off time; day boundaries in Asia/Baku.
 * - 24h:   now → now + 24 h (default)
 * - week:  now → now + 7 days
 * - all:   every not-yet-started match in the snapshot
 * - day:   one calendar day
 * - range: from-day 00:00 → to-day 24:00
 */
export type DateFilter =
  | { kind: "24h" }
  | { kind: "week" }
  | { kind: "all" }
  | { kind: "day"; date: string }
  | { kind: "range"; from: string; to: string };

export type DateFilterKind = DateFilter["kind"];

export const DEFAULT_DATE_FILTER: DateFilter = { kind: "24h" };

/** URL value of `filtr` for each kind. */
const PARAM: Record<DateFilterKind, string> = { "24h": "24saat", week: "hefte", all: "umumi", day: "tarix", range: "araliq" };

export interface DateWindow {
  from: Date;
  /** Exclusive; null = no upper bound. */
  to: Date | null;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar day ("2026-02-31" is rejected). */
function isDay(v: unknown): v is string {
  if (typeof v !== "string" || !DAY_RE.test(v)) return false;
  const start = dayStart(v);
  return !Number.isNaN(start.getTime()) && bakuDay(start) === v;
}

/** 00:00 Asia/Baku of a "YYYY-MM-DD" day. */
export function dayStart(day: string): Date {
  return new Date(`${day}T00:00:00${DISPLAY.utcOffset}`);
}

/** Calendar day ("YYYY-MM-DD") of an instant in Asia/Baku. */
export function bakuDay(instant: Date): string {
  const [h, m] = DISPLAY.utcOffset.slice(1).split(":").map(Number) as [number, number];
  const sign = DISPLAY.utcOffset.startsWith("-") ? -1 : 1;
  return new Date(instant.getTime() + sign * (h * 60 + m) * 60_000).toISOString().slice(0, 10);
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Reads `?filtr=…&tarix=…&bas=…&son=…`; anything invalid falls back to the default. */
export function parseDateFilter(params: Params): DateFilter {
  const kind = (Object.keys(PARAM) as DateFilterKind[]).find((k) => PARAM[k] === one(params.filtr));
  if (kind === "day") {
    const date = one(params.tarix);
    return isDay(date) ? { kind, date } : DEFAULT_DATE_FILTER;
  }
  if (kind === "range") {
    const a = one(params.bas);
    const b = one(params.son);
    if (!isDay(a) || !isDay(b)) return DEFAULT_DATE_FILTER;
    return a <= b ? { kind, from: a, to: b } : { kind, from: b, to: a };
  }
  return kind ? ({ kind } as DateFilter) : DEFAULT_DATE_FILTER;
}

export function toSearchParams(f: DateFilter): string {
  const q = new URLSearchParams({ filtr: PARAM[f.kind] });
  if (f.kind === "day") q.set("tarix", f.date);
  if (f.kind === "range") {
    q.set("bas", f.from);
    q.set("son", f.to);
  }
  return q.toString();
}

export function dateWindow(f: DateFilter, now: Date): DateWindow {
  switch (f.kind) {
    case "24h":
      return { from: now, to: new Date(now.getTime() + 24 * 60 * 60 * 1000) };
    case "week":
      return { from: now, to: addDays(now, 7) };
    case "all":
      return { from: now, to: null };
    case "day":
      return { from: dayStart(f.date), to: addDays(dayStart(f.date), 1) };
    case "range":
      return { from: dayStart(f.from), to: addDays(dayStart(f.to), 1) };
  }
}

export function inWindow(commenceTime: string | Date, w: DateWindow): boolean {
  const t = new Date(commenceTime).getTime();
  return t >= w.from.getTime() && (w.to === null || t < w.to.getTime());
}
