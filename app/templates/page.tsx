import { EmptyState } from "@/components/EmptyState";
import { TemplatesView, type TemplateDto } from "@/components/TemplatesView";
import { TEMPLATES } from "@/lib/config";
import { allLegs } from "@/lib/templates/build";
import { analyzeSync, latestDataSync } from "@/server/analysis.service";
import { db } from "@/server/db";
import { blockedMatchIds, listTemplates } from "@/server/templates.service";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const sync = await latestDataSync(db);
  if (!sync) return <EmptyState />;

  const now = new Date();
  const [templates, analyses, blocked] = await Promise.all([
    listTemplates(db, sync.id),
    analyzeSync(db, sync.id),
    blockedMatchIds(db, now),
  ]);

  const dtos: TemplateDto[] = templates.map((t) => ({
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
      templates={dtos}
      legs={allLegs(analyses, now)}
      rules={TEMPLATES.rules.map((r) => ({ ...r }))}
      maxDisagreement={TEMPLATES.maxDisagreement}
      blockedMatchIds={[...blocked]}
    />
  );
}
