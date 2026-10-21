import { EmptyState } from "@/components/EmptyState";
import { TemplatesView, type TemplateDto } from "@/components/TemplatesView";
import { SAVED_TEMPLATE_TYPES, TEMPLATES } from "@/lib/config";
import { bakuDay, dateWindow, inWindow, parseDateFilter, toSearchParams } from "@/lib/date-filter";
import { allLegs } from "@/lib/templates/build";
import { analyzeSync, latestDataSync } from "@/server/analysis.service";
import { db } from "@/server/db";
import { blockedMatchIds, buildAutoTemplates, listTemplates } from "@/server/templates.service";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sync = await latestDataSync(db);
  if (!sync) return <EmptyState />;

  const now = new Date();
  const filter = parseDateFilter(await searchParams);
  const window = dateWindow(filter, now);
  const [templates, analyses, blocked] = await Promise.all([
    listTemplates(db, sync.id),
    analyzeSync(db, sync.id),
    blockedMatchIds(db, now),
  ]);

  // The date filter applies to the generator, the system suggestions and the manual builder alike.
  const inRange = analyses.filter((a) => inWindow(a.commenceTime, window));
  const legs = allLegs(inRange, now);

  // System suggestions are built live for the chosen window (the stored ones cover the whole snapshot).
  const auto: TemplateDto[] = buildAutoTemplates(inRange, blocked, now).flatMap(({ template }) =>
    template
      ? [
          {
            id: template.type,
            type: template.type,
            createdAt: sync.startedAt.toISOString(),
            combinedProbability: template.combinedProbability,
            fairOdds: template.fairOdds,
            legs: template.legs.map((l) => ({
              matchId: l.matchId,
              homeTeam: l.homeTeam,
              awayTeam: l.awayTeam,
              commenceTime: l.commenceTime,
              market: l.market,
              selection: l.selection,
              probability: l.probability,
              bookmakerCount: l.bookmakerCount,
            })),
          },
        ]
      : [],
  );

  const saved: TemplateDto[] = templates
    .filter((t) => (SAVED_TEMPLATE_TYPES as readonly string[]).includes(t.type))
    .map((t) => ({
      id: t.id,
      type: t.type,
      createdAt: t.createdAt.toISOString(),
      combinedProbability: t.combinedProbability,
      fairOdds: t.fairOdds,
      legs: t.legs.map((l) => ({
        matchId: l.matchId,
        homeTeam: l.match.homeTeam,
        awayTeam: l.match.awayTeam,
        commenceTime: l.match.commenceTime.toISOString(),
        market: l.market,
        selection: l.selection,
        probability: l.probability,
        bookmakerCount: l.bookmakerCount,
      })),
    }));

  return (
    <TemplatesView
      syncId={sync.id}
      templates={[...auto, ...saved]}
      legs={legs}
      rules={TEMPLATES.rules.map((r) => ({ ...r }))}
      maxDisagreement={TEMPLATES.maxDisagreement}
      blockedMatchIds={[...blocked]}
      filter={filter}
      filterKey={toSearchParams(filter)}
      matchCount={new Set(legs.map((l) => l.matchId)).size}
      today={bakuDay(now)}
    />
  );
}
