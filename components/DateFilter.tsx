"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SYNC } from "@/lib/config";
import { dayStart, bakuDay, toSearchParams, type DateFilter as Filter, type DateFilterKind } from "@/lib/date-filter";
import { addDays } from "@/lib/time";

interface Props {
  filter: Filter;
  matchCount: number;
  /** Today in Asia/Baku ("YYYY-MM-DD"), from the server so both renders agree. */
  today: string;
}

const OPTIONS: { kind: DateFilterKind; label: string }[] = [
  { kind: "24h", label: "24 saat" },
  { kind: "week", label: "Bu həftə" },
  { kind: "all", label: "Ümumi" },
  { kind: "day", label: "Tarix" },
  { kind: "range", label: "Aralıq" },
];

/** "2026-10-23" → "23.10.2026" */
const showDay = (d: string) => d.split("-").reverse().join(".");
const plusDays = (d: string, n: number) => bakuDay(addDays(dayStart(d), n));

function describe(f: Filter): string {
  switch (f.kind) {
    case "24h":
      return "İndidən 24 saat ərzində başlayan matçlar";
    case "week":
      return "İndidən 7 gün ərzində başlayan matçlar";
    case "all":
      return "Bütün başlamamış matçlar";
    case "day":
      return `${showDay(f.date)} tarixində başlayan matçlar`;
    case "range":
      return `${showDay(f.from)} – ${showDay(f.to)} arasında başlayan matçlar`;
  }
}

export function DateFilter({ filter, matchCount, today }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const lastDay = plusDays(today, SYNC.daysAhead);

  const go = (f: Filter) => startTransition(() => router.push(`/templates?${toSearchParams(f)}`, { scroll: false }));

  function pick(kind: DateFilterKind) {
    if (kind === "day") go({ kind, date: filter.kind === "day" ? filter.date : plusDays(today, 1) });
    else if (kind === "range") go(filter.kind === "range" ? filter : { kind, from: today, to: plusDays(today, 2) });
    else go({ kind } as Filter);
  }

  const dateInput = (id: string, label: string, value: string, onChange: (v: string) => void) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={today}
        max={lastDay}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="tabular h-10 rounded-md border border-border-strong bg-surface px-3 text-sm"
      />
    </div>
  );

  return (
    <section aria-label="Tarix filtri" className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">Tarix:</span>
        <div role="group" aria-label="Tarix filtri" className="flex flex-wrap rounded-lg border border-border bg-surface-2 p-0.5 text-sm">
          {OPTIONS.map((o) => (
            <button
              key={o.kind}
              type="button"
              onClick={() => pick(o.kind)}
              aria-pressed={filter.kind === o.kind}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors duration-150 ${
                filter.kind === o.kind ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {filter.kind === "day" && dateInput("filter-day", "Gün", filter.date, (date) => go({ kind: "day", date }))}
        {filter.kind === "range" && (
          <div className="flex flex-wrap items-end gap-2">
            {dateInput("filter-from", "Başlanğıc", filter.from, (from) => go({ kind: "range", from, to: from > filter.to ? from : filter.to }))}
            <span aria-hidden="true" className="pb-2 text-subtle">
              –
            </span>
            {dateInput("filter-to", "Son", filter.to, (to) => go({ kind: "range", from: to < filter.from ? to : filter.from, to }))}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-muted" aria-live="polite">
        {pending ? "Yüklənir…" : `${describe(filter)} · ${matchCount} matç. Filtr generatora, sistemin təkliflərinə və fərdi kupona aiddir.`}
      </p>
    </section>
  );
}
