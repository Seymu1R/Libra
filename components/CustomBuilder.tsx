"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { competitionName } from "@/lib/config";
import { formatOdds, formatPercent, formatPoints } from "@/lib/format";
import { MARKET_LABEL, selectionLabel } from "@/lib/labels";
import type { Leg } from "@/lib/templates/build";
import { combine } from "@/lib/templates/combine";
import { formatBaku } from "@/lib/time";

interface Props {
  syncId: string;
  legs: Leg[];
  maxDisagreement: number;
}

const legKey = (l: Pick<Leg, "matchId" | "market" | "selection">) => `${l.matchId}|${l.market}|${l.selection}`;

export function CustomBuilder({ syncId, legs, maxDisagreement }: Props) {
  const router = useRouter();
  // matchId → selected leg key (one selection per match)
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => {
    const map = new Map<string, Leg[]>();
    for (const l of legs) map.set(l.matchId, [...(map.get(l.matchId) ?? []), l]);
    return [...map.values()];
  }, [legs]);

  const selectedLegs = legs.filter((l) => picked[l.matchId] === legKey(l));
  const combined = combine(selectedLegs);

  function toggle(l: Leg) {
    setPicked((p) => {
      const next = { ...p };
      if (next[l.matchId] === legKey(l)) delete next[l.matchId];
      else next[l.matchId] = legKey(l);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/templates/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        syncId,
        legs: selectedLegs.map((l) => ({ matchId: l.matchId, market: l.market, selection: l.selection })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Xəta");
      return;
    }
    setPicked({});
    router.refresh();
  }

  return (
    <section>
      <h2 className="text-lg font-semibold">Fərdi kupon</h2>
      <p className="mb-4 text-sm text-muted">
        Seçimləri özünüz edin — hər matçdan bir seçim. Ehtimal və ədalətli əmsal dərhal hesablanır.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
          {matches.length === 0 && <p className="text-sm text-muted">Başlamamış analiz edilmiş matç yoxdur.</p>}
          {matches.map((ms) => {
            const m = ms[0]!;
            return (
              <div key={m.matchId} className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {m.homeTeam} — {m.awayTeam}
                  </span>
                  <span className="text-xs text-muted">
                    {competitionName(m.competition)} · <span className="tabular">{formatBaku(m.commenceTime)}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ms.map((l) => {
                    const active = picked[l.matchId] === legKey(l);
                    const risky = l.disagreement > maxDisagreement;
                    return (
                      <button
                        key={legKey(l)}
                        type="button"
                        onClick={() => toggle(l)}
                        title={`${MARKET_LABEL[l.market]} · fikir ayrılığı ${formatPoints(l.disagreement)}`}
                        aria-pressed={active}
                        className={`tabular min-h-8 rounded-md border px-2.5 py-1 text-xs transition-colors duration-150 ${
                          active
                            ? "border-primary bg-primary text-on-primary"
                            : risky
                              ? "border-danger-border text-danger hover:bg-danger-soft"
                              : "border-border-strong hover:bg-surface-2"
                        }`}
                      >
                        {selectionLabel(l.market, l.selection)} <span className="opacity-75">{formatPercent(l.probability)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="h-fit rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-4">
          <h3 className="font-semibold">Seçilmiş: {selectedLegs.length}</h3>
          <ul className="my-3 space-y-1 text-sm">
            {selectedLegs.map((l) => (
              <li key={legKey(l)} className="flex justify-between gap-2">
                <span className="truncate">
                  {l.homeTeam} — {l.awayTeam}: <strong>{selectionLabel(l.market, l.selection)}</strong>
                </span>
                <span className="tabular">{formatPercent(l.probability)}</span>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
            <div>
              <div className="text-xs text-muted">Ümumi ehtimal</div>
              <div className="tabular text-2xl font-semibold">{combined ? formatPercent(combined.combinedProbability) : "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">Ədalətli əmsal</div>
              <div className="tabular text-2xl font-semibold">{combined ? formatOdds(combined.fairOdds) : "—"}</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Hasil nəticələrin asılı olmadığını fərz edir.</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={selectedLegs.length === 0 || saving}
              className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-subtle"
            >
              Yadda saxla
            </button>
            <button
              type="button"
              onClick={() => setPicked({})}
              disabled={selectedLegs.length === 0}
              className="rounded-md border border-border-strong px-3 py-2 text-sm transition-colors duration-150 hover:bg-surface-2 disabled:opacity-50"
            >
              Təmizlə
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </aside>
      </div>
    </section>
  );
}
