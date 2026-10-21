import { MatchesView } from "@/components/MatchesView";
import { EmptyState } from "@/components/EmptyState";
import { COMPETITIONS, sportOf } from "@/lib/config";
import { currentSport } from "./current-sport";
import { analyzeSync, latestDataSync } from "@/server/analysis.service";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const sync = await latestDataSync(db);
  if (!sync) return <EmptyState />;
  const sport = await currentSport();
  const analyses = (await analyzeSync(db, sync.id)).filter((a) => sportOf(a.competition) === sport);
  return (
    <MatchesView
      key={sport}
      analyses={analyses}
      competitions={COMPETITIONS.filter((c) => c.sport === sport).map((c) => ({ key: c.key, name: c.name }))}
    />
  );
}
