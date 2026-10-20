"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TemplateRule } from "@/lib/config";
import { formatOdds, formatPercent, formatPoints } from "@/lib/format";
import { describeSelection, MARKET_LABEL, SELECTION_LABEL, TEMPLATE_LABEL } from "@/lib/labels";
import type { Market, Selection } from "@/lib/analysis/types";
import type { Leg } from "@/lib/templates/build";
import { formatBaku } from "@/lib/time";
import { CustomBuilder } from "./CustomBuilder";

export interface TemplateDto {
  id: string;
  type: string;
  createdAt: string;
  combinedProbability: number;
  fairOdds: number;
  legs: {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
    market: string;
    selection: string;
    probability: number;
    bookmakerCount: number;
  }[];
}

interface Props {
  syncId: string;
  templates: TemplateDto[];
  legs: Leg[];
  rules: TemplateRule[];
  maxDisagreement: number;
}

export function TemplatesView({ syncId, templates, legs, rules, maxDisagreement }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const auto = templates.filter((t) => t.type !== "CUSTOM");
  const custom = templates.filter((t) => t.type === "CUSTOM");

  async function regenerate() {
    setBusy(true);
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syncId }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/templates/custom?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Kupon şablonları</h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              Hər matçdan ən çox bir seçim. Fikir ayrılığı {formatPoints(maxDisagreement)}-dən çox olan seçimlər çıxarılır.
              Ümumi ehtimal ayaqların ehtimallarının hasilidir — bu, nəticələrin <strong>bir-birindən asılı olmadığını</strong> fərz edir.
            </p>
          </div>
          <button
            type="button"
            onClick={regenerate}
            disabled={busy}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            title="Saxlanmış məlumatdan yenidən hesablayır — API çağırılmır"
          >
            {busy ? "Hesablanır…" : "Yenidən hesabla"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {rules.map((rule) => {
            const t = auto.find((x) => x.type === rule.type);
            return t ? (
              <TemplateCard key={rule.type} template={t} subtitle={ruleText(rule)} />
            ) : (
              <div key={rule.type} className="rounded-xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700">
                <h2 className="font-semibold">{rule.label}</h2>
                <p className="text-xs text-zinc-500">{ruleText(rule)}</p>
                <p className="mt-4 text-sm text-zinc-500">Kifayət qədər uyğun seçim yoxdur.</p>
              </div>
            );
          })}
        </div>
      </section>

      <CustomBuilder syncId={syncId} legs={legs} maxDisagreement={maxDisagreement} />

      {custom.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Saxlanmış fərdi kuponlar</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {custom.map((t) => (
              <TemplateCard key={t.id} template={t} subtitle={formatBaku(t.createdAt)} onDelete={() => remove(t.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ruleText(r: TemplateRule) {
  return `${r.minLegs}–${r.maxLegs} seçim, hər biri ≥ ${formatPercent(r.minLegProbability)}`;
}

function TemplateCard({ template, subtitle, onDelete }: { template: TemplateDto; subtitle: string; onDelete?: () => void }) {
  return (
    <article className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold">{TEMPLATE_LABEL[template.type] ?? template.type}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="text-xs text-zinc-400 hover:text-red-600">
            Sil
          </button>
        )}
      </div>

      <ul className="my-4 flex-1 space-y-3">
        {template.legs.map((l) => (
          <li key={l.matchId} className="text-sm">
            <div className="flex justify-between gap-2">
              <span className="font-medium">
                {l.homeTeam} — {l.awayTeam}
              </span>
              <span className="tabular font-semibold">{formatPercent(l.probability)}</span>
            </div>
            <div className="flex justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                {MARKET_LABEL[l.market as Market]}: <strong>{SELECTION_LABEL[l.selection as Selection]}</strong> ·{" "}
                {describeSelection(l.selection, l.homeTeam, l.awayTeam)}
              </span>
              <span className="tabular whitespace-nowrap">{formatBaku(l.commenceTime)}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Ümumi ehtimal</div>
          <div className="tabular text-2xl font-semibold">{formatPercent(template.combinedProbability)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Ədalətli kupon əmsalı</div>
          <div className="tabular text-2xl font-semibold">{formatOdds(template.fairOdds)}</div>
        </div>
      </div>
    </article>
  );
}
