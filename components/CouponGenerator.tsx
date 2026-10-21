"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GENERATOR, TEMPLATES, competitionName } from "@/lib/config";
import { formatOdds, formatPercent, parseDecimal } from "@/lib/format";
import { describeSelection, MARKET_LABEL, SELECTION_LABEL } from "@/lib/labels";
import type { Leg } from "@/lib/templates/build";
import { generateCoupon, type GeneratedCoupon, type GeneratorGoal } from "@/lib/templates/generate";
import { formatBaku } from "@/lib/time";

type Mode = GeneratorGoal["mode"];

interface Props {
  syncId: string;
  legs: Leg[];
  blockedMatchIds: string[];
  maxDisagreement: number;
}

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "target", label: "Hədəf", hint: "Əmsal və ya ehtimal yazın — biri o birini avtomatik doldurur. Kupon bu hədəfə ən yaxın qurulur." },
  { value: "range", label: "Aralıq", hint: "Kuponun ədalətli əmsalı ən azı bu qədər, ehtimalı ən azı bu qədər olmalıdır." },
  { value: "real", label: "Real əmsal", hint: "Əmsal bukmekerlərdəki ən yaxşı real əmsalların hasilidir (ödəniş). İkili şans bu rejimdə istifadə olunmur — onun real əmsalı yoxdur." },
];

const toInput = (n: number, digits: number) => n.toFixed(digits).replace(".", ",");

export function CouponGenerator({ syncId, legs, blockedMatchIds, maxDisagreement }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("target");
  const [odds, setOdds] = useState("2,50");
  const [percent, setPercent] = useState("40,0");
  const [coupon, setCoupon] = useState<GeneratedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // In "Hədəf" mode the two inputs are one number: fair odds = 1 / probability.
  function onOdds(v: string) {
    setOdds(v);
    const o = parseDecimal(v);
    if (mode === "target" && o > 1) setPercent(toInput(100 / o, 1));
  }
  function onPercent(v: string) {
    setPercent(v);
    const p = parseDecimal(v);
    if (mode === "target" && p > 0 && p < 100) setOdds(toInput(100 / p, 2));
  }

  function switchMode(m: Mode) {
    setMode(m);
    setCoupon(null);
    setError(null);
    const o = parseDecimal(odds);
    if (m === "target" && o > 1) setPercent(toInput(100 / o, 1));
  }

  function generate() {
    setSaved(false);
    const o = parseDecimal(odds);
    const p = parseDecimal(percent) / 100;
    if (Number.isNaN(o) || Number.isNaN(p)) {
      setCoupon(null);
      setError("Rəqəmləri düzgün daxil edin (məs. 2,50 və 40).");
      return;
    }
    const goal: GeneratorGoal =
      mode === "target"
        ? { mode, probability: p }
        : mode === "range"
          ? { mode, minOdds: o, minProbability: p }
          : { mode, minRealOdds: o, minProbability: p };
    const result = generateCoupon(legs, goal, {
      maxDisagreement,
      blocked: new Set(blockedMatchIds),
      repeatAllowedAbove: TEMPLATES.repeatAllowedAbove,
    });
    if (result.ok) {
      setCoupon(result.coupon);
      setError(null);
    } else {
      setCoupon(null);
      setError(result.error);
    }
  }

  async function save() {
    if (!coupon) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/templates/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        syncId,
        type: "GENERATED",
        legs: coupon.legs.map((l) => ({ matchId: l.matchId, market: l.market, selection: l.selection })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Xəta");
      return;
    }
    setCoupon(null);
    setSaved(true);
    router.refresh();
  }

  const current = MODES.find((m) => m.value === mode)!;
  const oddsLabel = mode === "target" ? "Əmsal" : mode === "range" ? "Min. əmsal" : "Min. real əmsal";
  const percentLabel = mode === "target" ? "Ümumi ehtimal" : "Min. ehtimal";

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h1 className="text-xl font-semibold">Kupon generatoru</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        Hədəfi daxil edin — sistem seçim sayını özü təyin edib uyğun kuponu qurur ({GENERATOR.minLegs}–{GENERATOR.maxLegs} seçim). Saxlanmış
        kuponların matçları təkrarlanmır; ehtimalı {formatPercent(TEMPLATES.repeatAllowedAbove)}-dən yuxarı seçimlər istisnadır.
      </p>

      <div role="group" aria-label="Rejim" className="mt-4 inline-flex rounded-lg border border-border bg-surface-2 p-0.5 text-sm">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => switchMode(m.value)}
            aria-pressed={mode === m.value}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors duration-150 ${
              mode === m.value ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{current.hint}</p>

      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
      >
        <NumberField id="gen-odds" label={oddsLabel} value={odds} onChange={onOdds} placeholder="2,50" />
        {mode === "target" && (
          <span aria-hidden="true" className="pb-2 text-subtle">
            ⇄
          </span>
        )}
        <NumberField id="gen-percent" label={percentLabel} value={percent} onChange={onPercent} placeholder="40" suffix="%" />
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-on-primary transition-colors duration-150 hover:bg-primary-hover"
        >
          Kupon yarat
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      {saved && !coupon && <p className="mt-3 text-sm text-primary-fg">Kupon yadda saxlanıldı. Onun matçları artıq digər kuponlarda təkrarlanmayacaq.</p>}

      {coupon && (
        <div className="mt-5 rounded-lg border border-border bg-surface-2 p-4">
          <ul className="space-y-3">
            {coupon.legs.map((l) => (
              <li key={l.matchId} className="text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">
                    {l.homeTeam} — {l.awayTeam}
                  </span>
                  <span className="tabular font-semibold">{formatPercent(l.probability)}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span>
                    {MARKET_LABEL[l.market]}: <strong>{SELECTION_LABEL[l.selection]}</strong> · {describeSelection(l.selection, l.homeTeam, l.awayTeam)}
                    {l.bestOdds && (
                      <span className="text-highlight">
                        {" "}
                        · ən yaxşı {formatOdds(l.bestOdds.price)} ({l.bestOdds.bookmakerTitle})
                      </span>
                    )}
                  </span>
                  <span className="tabular whitespace-nowrap">
                    {competitionName(l.competition)} · {formatBaku(l.commenceTime)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
            <Stat label="Seçim sayı" value={String(coupon.legs.length)} />
            <Stat label="Ümumi ehtimal" value={formatPercent(coupon.combinedProbability)} />
            <Stat label="Ədalətli əmsal" value={formatOdds(coupon.fairOdds)} />
            <Stat label="Real əmsal (ən yaxşı)" value={coupon.realOdds ? formatOdds(coupon.realOdds) : "—"} />
          </div>
          <p className="mt-2 text-xs text-subtle">Hasil nəticələrin asılı olmadığını fərz edir.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saxlanılır…" : "Yadda saxla"}
            </button>
            <button
              type="button"
              onClick={() => setCoupon(null)}
              className="rounded-md border border-border-strong px-3 py-2 text-sm transition-colors duration-150 hover:bg-surface"
            >
              Ləğv et
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function NumberField(props: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string; suffix?: string }) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1 block text-xs font-medium text-muted">
        {props.label}
      </label>
      <div className="flex h-10 items-center rounded-md border border-border-strong bg-surface focus-within:outline-2 focus-within:outline-ring">
        <input
          id={props.id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
          className="tabular h-full w-28 rounded-md bg-transparent px-3 text-base outline-none"
        />
        {props.suffix && <span className="pr-3 text-sm text-subtle">{props.suffix}</span>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="tabular text-xl font-semibold">{value}</div>
    </div>
  );
}
