"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SAVED_TEMPLATE_TYPES, TEMPLATES, savedTypeFor, type TemplateRule, type TemplateType } from "@/lib/config";
import { formatOdds, formatPercent, formatPoints } from "@/lib/format";
import { describeSelection, MARKET_LABEL, selectionLabel, TEMPLATE_LABEL } from "@/lib/labels";
import type { Market } from "@/lib/analysis/types";
import { couponSignature, type Leg } from "@/lib/templates/build";
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
    competition: string;
    line: number | null;
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

export function TemplatesView({
  syncId,
  templates,
  legs,
  rules,
  maxDisagreement,
  blockedMatchIds,
  filter,
  filterKey,
  matchCount,
  today,
}: Props) {
  const router = useRouter();
  const auto = templates.filter((t) => !isSaved(t.type));
  const saved = templates.filter((t) => isSaved(t.type)).reverse();
  const savedSignatures = new Set(saved.map((t) => couponSignature(t.legs)));
  const [savingType, setSavingType] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  async function remove(id: string) {
    await fetch(`/api/templates/custom?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setNotice({
      kind: "ok",
      text: "Kupon silindi. Onun matçları yenidən təkliflərdə istifadə oluna bilər.",
    });
    router.refresh();
  }

  // Keeps a system suggestion: stored as SAVED_<rule>, its matches become blocked and the suggestions rebuild.
  async function keep(t: TemplateDto) {
    setSavingType(t.type);
    setNotice(null);
    const res = await fetch("/api/templates/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        syncId,
        type: savedTypeFor(t.type as TemplateType),
        legs: t.legs.map((l) => ({
          matchId: l.matchId,
          market: l.market,
          selection: l.selection,
        })),
      }),
    });
    setSavingType(null);
    if (!res.ok) {
      setNotice({ kind: "error", text: (await res.json()).error ?? "Xəta" });
      return;
    }
    setNotice({
      kind: "ok",
      text: `“${TEMPLATE_LABEL[t.type]}” yadda saxlanıldı — aşağıda “Saxlanmış kuponlar” bölməsindədir.`,
    });
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
              Seçilmiş tarix filtri üzrə hər dəfə yenidən hesablanır. Hər matçdan ən çox bir seçim; üç təklif bir-biri ilə matç paylaşmır,
              saxlanmış kuponların matçlarından isə yalnız ehtimalı {formatPercent(TEMPLATES.repeatAllowedAbove)}-dən yuxarı seçimlər
              götürülür. Fikir ayrılığı {formatPoints(maxDisagreement)}-dən çox olan seçimlər çıxarılır. Ümumi ehtimal ayaqların
              ehtimallarının hasilidir — bu, nəticələrin <strong>bir-birindən asılı olmadığını</strong> fərz edir.
            </p>
          </div>
        </div>

        {notice && (
          <p role="status" className={`mb-4 text-sm ${notice.kind === "ok" ? "text-primary-fg" : "text-danger"}`}>
            {notice.text}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {rules.map((rule) => {
            const t = auto.find((x) => x.type === rule.type);
            return t ? (
              <TemplateCard
                key={rule.type}
                template={t}
                subtitle={ruleText(rule)}
                action={
                  savedSignatures.has(couponSignature(t.legs)) ? (
                    <span className="inline-flex h-9 items-center gap-1.5 rounded-md bg-surface-2 px-3 text-sm font-medium text-muted">
                      <Icon d="M20 6L9 17l-5-5" />
                      Saxlanılıb
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => keep(t)}
                      disabled={savingType !== null}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-primary px-3 text-sm font-medium text-primary-fg transition-colors duration-150 hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Icon d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      {savingType === t.type ? "Saxlanılır…" : "Yadda saxla"}
                    </button>
                  )
                }
              />
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
              <TemplateCard
                key={t.id}
                template={t}
                subtitle={`Saxlanılıb: ${formatBaku(t.createdAt)}`}
                action={<DeleteButton onConfirm={() => remove(t.id)} />}
              />
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

function Icon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const TRASH = "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6";

/** Two-step delete inside the card (no browser dialog): "Sil" → "Silinsin? Bəli, sil / Ləğv et". Esc cancels. */
function DeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirming) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setConfirming(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-danger/50 px-3 text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger-soft"
      >
        <Icon d={TRASH} />
        Sil
      </button>
    );
  }
  return (
    <div role="group" aria-label="Silməni təsdiqlə" className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">Silinsin?</span>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onConfirm();
        }}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-danger px-3 text-sm font-medium text-on-danger transition-opacity duration-150 hover:opacity-90 disabled:opacity-60"
      >
        <Icon d={TRASH} />
        {busy ? "Silinir…" : "Bəli, sil"}
      </button>
      <button
        ref={cancelRef}
        type="button"
        onClick={() => setConfirming(false)}
        className="h-9 rounded-md border border-border-strong px-3 text-sm transition-colors duration-150 hover:bg-surface-2"
      >
        Ləğv et
      </button>
    </div>
  );
}

function TemplateCard({ template, subtitle, action }: { template: TemplateDto; subtitle: string; action?: React.ReactNode }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="font-semibold">{TEMPLATE_LABEL[template.type] ?? template.type}</h2>
        <p className="text-xs text-muted">{subtitle}</p>
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
                {MARKET_LABEL[l.market as Market]}: <strong>{selectionLabel(l.market, l.selection, l.line)}</strong> ·{" "}
                {describeSelection(l.market, l.selection, l.homeTeam, l.awayTeam, l.line)}
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
      {action && <div className="mt-4 flex justify-end">{action}</div>}
    </article>
  );
}
