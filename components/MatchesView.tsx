"use client";

import { useMemo, useState } from "react";
import type { MatchAnalysis } from "@/lib/analysis/types";
import { MatchCard } from "./MatchCard";

interface Props {
  analyses: MatchAnalysis[];
  competitions: { key: string; name: string }[];
}

// Filters run on data already loaded from the stored snapshot — never on the odds API.
export function MatchesView({ analyses, competitions }: Props) {
  const [competition, setCompetition] = useState<string>("all");
  const [showSkipped, setShowSkipped] = useState(false);

  const groups = useMemo(() => {
    return competitions
      .filter((c) => competition === "all" || c.key === competition)
      .map((c) => ({
        ...c,
        matches: analyses.filter((a) => a.competition === c.key && (showSkipped || !a.skipped)),
      }))
      .filter((g) => g.matches.length > 0);
  }, [analyses, competitions, competition, showSkipped]);

  const skippedCount = analyses.filter((a) => a.skipped).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" onClick={() => setCompetition("all")} className={chip(competition === "all")}>
          Hamısı
        </button>
        {competitions
          .filter((c) => analyses.some((a) => a.competition === c.key))
          .map((c) => (
            <button key={c.key} type="button" onClick={() => setCompetition(c.key)} className={chip(competition === c.key)}>
              {c.name}
            </button>
          ))}
        {skippedCount > 0 && (
          <label className="ml-auto flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <input type="checkbox" checked={showSkipped} onChange={(e) => setShowSkipped(e.target.checked)} className="accent-emerald-600" />
            Az bukmekerli matçları göstər ({skippedCount})
          </label>
        )}
      </div>

      {groups.length === 0 && <p className="text-sm text-zinc-500">Bu filtrə uyğun matç yoxdur.</p>}

      {groups.map((g) => (
        <section key={g.key}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {g.name} <span className="font-normal">· {g.matches.length}</span>
          </h2>
          <div className="grid gap-3">
            {g.matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function chip(active: boolean) {
  return `rounded-full border px-3 py-1 transition ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
      : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
  }`;
}
