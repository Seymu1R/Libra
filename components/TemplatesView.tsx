"use client";

import { useRouter } from "next/navigation";
import { SAVED_TEMPLATE_TYPES, TEMPLATES, type TemplateRule } from "@/lib/config";
import { formatOdds, formatPercent, formatPoints } from "@/lib/format";
import { describeSelection, MARKET_LABEL, SELECTION_LABEL, TEMPLATE_LABEL } from "@/lib/labels";
import type { Market, Selection } from "@/lib/analysis/types";
import type { Leg } from "@/lib/templates/build";
import { formatBaku } from "@/lib/time";
import type { DateFilter as Filter } from "@/lib/date-filter";
import { CouponGenerator } from "./CouponGenerator";
import { DateFilter } from "./DateFilter";
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
  blockedMatchIds: string[];
  filter: Filter;
  /** Changes with the filter — remounts the generator and the builder so stale picks are dropped. */
  filterKey: string;
  matchCount: number;
  today: string;
}

const isSaved = (type: string) => (SAVED_TEMPLATE_TYPES as readonly string[]).includes(type);

export function TemplatesView({ syncId, templates, legs, rules, maxDisagreement, blockedMatchIds, filter, filterKey, matchCount, today }: Props) {
  const router = useRouter();
  const auto = templates.filter((t) => !isSaved(t.type));
  const saved = templates.filter((t) => isSaved(t.type)).reverse();

  async function remove(id: string) {
    await fetch(`/api/templates/custom?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <DateFilter filter={filter} matchCount={matchCount} today={today} />
        <CouponGenerator key={filterKey} syncId={syncId} legs={legs} blockedMatchIds={blockedMatchIds} maxDisagreement={maxDisagreement} />
      </div>

      <section>
        <div className="mb-4">
          <div>
            <h2 className="text-lg font-semibold">Sistemin təklifləri</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Seçilmiş tarix filtri üzrə hər dəfə yenidən hesablanır. Hər matçdan ən çox bir seçim; üç təklif bir-biri ilə matç paylaşmır, saxlanmış kuponların matçlarından isə yalnız
              {" "}ehtimalı {formatPercent(TEMPLATES.repeatAllowedAbove)}-dən yuxarı seçimlər götürülür. Fikir ayrılığı {formatPoints(maxDisagreement)}-dən çox olan seçimlər çıxarılır.
              Ümumi ehtimal ayaqların ehtimallarının hasilidir — bu, nəticələrin <strong>bir-birindən asılı olmadığını</strong> fərz edir.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {rules.map((rule) => {
            const t = auto.find((x) => x.type === rule.type);
            return t ? (
              <TemplateCard key={rule.type} template={t} subtitle={ruleText(rule)} />
            ) : (
              <div key={rule.type} className="rounded-xl border border-dashed border-border-strong p-5">
                <h2 className="font-semibold">{rule.label}</h2>
                <p className="text-xs text-muted">{ruleText(rule)}</p>
                <p className="mt-4 text-sm text-muted">Kifayət qədər uyğun seçim yoxdur.</p>
              </div>
            );
          })}
        </div>
      </section>

      <CustomBuilder key={filterKey} syncId={syncId} legs={legs} maxDisagreement={maxDisagreement} />

      {saved.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Saxlanmış kuponlar</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {saved.map((t) => (
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
    <article className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold">{TEMPLATE_LABEL[template.type] ?? template.type}</h2>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded px-1.5 py-1 text-xs text-subtle transition-colors duration-150 hover:text-danger">
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
            <div className="flex justify-between gap-2 text-xs text-muted">
              <span>
                {MARKET_LABEL[l.market as Market]}: <strong>{SELECTION_LABEL[l.selection as Selection]}</strong> ·{" "}
                {describeSelection(l.selection, l.homeTeam, l.awayTeam)}
              </span>
              <span className="tabular whitespace-nowrap">{formatBaku(l.commenceTime)}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <div className="text-xs text-muted">Ümumi ehtimal</div>
          <div className="tabular text-2xl font-semibold">{formatPercent(template.combinedProbability)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Ədalətli kupon əmsalı</div>
          <div className="tabular text-2xl font-semibold">{formatOdds(template.fairOdds)}</div>
        </div>
      </div>
    </article>
  );
}
