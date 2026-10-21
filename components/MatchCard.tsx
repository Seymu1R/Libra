import type { MarketAnalysis, MatchAnalysis, SelectionAnalysis } from "@/lib/analysis/types";
import { ANALYSIS, sportOf, TEMPLATES } from "@/lib/config";
import { formatOdds, formatPercent, formatPoints } from "@/lib/format";
import { MARKET_LABEL, selectionLabel } from "@/lib/labels";
import { formatBaku } from "@/lib/time";

export function MatchCard({ match }: { match: MatchAnalysis }) {
  return (
    <article className={`rounded-xl border border-border bg-surface p-4 ${match.skipped ? "opacity-60" : ""}`}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">
          {match.homeTeam} <span className="text-subtle">—</span> {match.awayTeam}
        </h3>
        <div className="flex gap-3 text-xs text-muted">
          <span className="tabular">{formatBaku(match.commenceTime)}</span>
          <span>{match.bookmakerCount} bukmeker</span>
        </div>
      </div>

      {match.skipped ? (
        <p className="text-sm text-muted">
          Analiz edilmədi: {match.bookmakerCount} bukmeker (minimum {ANALYSIS.minBookmakers}).
        </p>
      ) : (
        <div className={`grid gap-3 ${sportOf(match.competition) === "basketball" ? "md:grid-cols-3" : "md:grid-cols-[3fr_3fr_2fr]"}`}>
          {(sportOf(match.competition) === "basketball" ? (["ML", "SPR", "TOT"] as const) : (["1X2", "DC", "OU"] as const)).map((key) => {
            // The soccer over/under column shows whichever line the match has (2.5, 3.5 or 4.5).
            const market = match.markets.find((m) => (key === "OU" ? m.market.startsWith("OU") : m.market === key));
            return market ? (
              <MarketBlock key={key} market={market} />
            ) : (
              <div key={key} className="rounded-lg bg-surface-2 p-3 text-xs text-subtle">
                <div className="mb-1 font-medium">{key === "OU" ? "Üst/Alt" : MARKET_LABEL[key]}</div>
                Kifayət qədər bukmeker yoxdur
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function MarketBlock({ market }: { market: MarketAnalysis }) {
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <div className="mb-2 flex justify-between text-xs text-muted">
        <span className="font-medium">
          {MARKET_LABEL[market.market]}
          {market.market === "TOT" && market.line !== null && <span className="tabular"> {market.line}</span>}
        </span>
        <span>{market.market === "DC" ? "1X2-dən hesablanıb" : `${market.bookmakerCount} bukmeker`}</span>
      </div>
      <div className={`grid gap-2 ${market.selections.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {market.selections.map((s) => (
          <SelectionCell key={s.selection} market={market.market} line={market.line} s={s} />
        ))}
      </div>
    </div>
  );
}

function SelectionCell({ market, line, s }: { market: string; line: number | null; s: SelectionAnalysis }) {
  const highDisagreement = s.disagreement > TEMPLATES.maxDisagreement;
  return (
    <div className="tabular text-center">
      <div className="text-xs text-muted">{selectionLabel(market, s.selection, line)}</div>
      <div className="text-base font-semibold">{formatPercent(s.probability)}</div>
      <div className="text-xs text-muted" title="Ədalətli əmsal = 1 / ehtimal">
        ədalətli {formatOdds(s.fairOdds)}
      </div>
      {s.bestOdds && (
        <div className="text-xs text-highlight" title={`Ən yaxşı əmsal: ${s.bestOdds.bookmakerTitle}`}>
          ən yaxşı {formatOdds(s.bestOdds.price)} · {s.bestOdds.bookmakerTitle}
        </div>
      )}
      <div
        className={`text-xs ${highDisagreement ? "font-medium text-danger" : "text-subtle"}`}
        title="Fikir ayrılığı: bukmekerlərin ədalətli ehtimalları arasında max − min (faiz bəndi)"
      >
        ± {formatPoints(s.disagreement)}
      </div>
    </div>
  );
}
