import type { MarketAnalysis, MatchAnalysis, SelectionAnalysis } from "@/lib/analysis/types";
import { ANALYSIS, TEMPLATES } from "@/lib/config";
import { formatOdds, formatPercent, formatPoints } from "@/lib/format";
import { MARKET_LABEL, SELECTION_LABEL } from "@/lib/labels";
import { formatBaku } from "@/lib/time";

export function MatchCard({ match }: { match: MatchAnalysis }) {
  return (
    <article
      className={`rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${match.skipped ? "opacity-60" : ""}`}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">
          {match.homeTeam} <span className="text-zinc-400">—</span> {match.awayTeam}
        </h3>
        <div className="flex gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="tabular">{formatBaku(match.commenceTime)}</span>
          <span>{match.bookmakerCount} bukmeker</span>
        </div>
      </div>

      {match.skipped ? (
        <p className="text-sm text-zinc-500">
          Analiz edilmədi: {match.bookmakerCount} bukmeker (minimum {ANALYSIS.minBookmakers}).
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-[3fr_3fr_2fr]">
          {(["1X2", "DC", "OU25"] as const).map((key) => {
            const market = match.markets.find((m) => m.market === key);
            return market ? (
              <MarketBlock key={key} market={market} />
            ) : (
              <div key={key} className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800/50">
                <div className="mb-1 font-medium">{MARKET_LABEL[key]}</div>
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
    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
      <div className="mb-2 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-medium">{MARKET_LABEL[market.market]}</span>
        <span>{market.market === "DC" ? "1X2-dən hesablanıb" : `${market.bookmakerCount} bukmeker`}</span>
      </div>
      <div className={`grid gap-2 ${market.selections.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {market.selections.map((s) => (
          <SelectionCell key={s.selection} s={s} />
        ))}
      </div>
    </div>
  );
}

function SelectionCell({ s }: { s: SelectionAnalysis }) {
  const highDisagreement = s.disagreement > TEMPLATES.maxDisagreement;
  return (
    <div className="tabular text-center">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{SELECTION_LABEL[s.selection]}</div>
      <div className="text-base font-semibold">{formatPercent(s.probability)}</div>
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400" title="Ədalətli əmsal = 1 / ehtimal">
        ədalətli {formatOdds(s.fairOdds)}
      </div>
      {s.bestOdds && (
        <div className="text-[11px] text-accent-700 dark:text-accent-500" title={`Ən yaxşı əmsal: ${s.bestOdds.bookmakerTitle}`}>
          ən yaxşı {formatOdds(s.bestOdds.price)} · {s.bestOdds.bookmakerTitle}
        </div>
      )}
      <div
        className={`text-[11px] ${highDisagreement ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-400"}`}
        title="Fikir ayrılığı: bukmekerlərin ədalətli ehtimalları arasında max − min (faiz bəndi)"
      >
        ± {formatPoints(s.disagreement)}
      </div>
    </div>
  );
}
