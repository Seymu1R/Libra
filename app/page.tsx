import { MatchesView } from "@/components/MatchesView";
import { EmptyState } from "@/components/EmptyState";
import { COMPETITIONS } from "@/lib/config";
import { analyzeSync, latestDataSync } from "@/server/analysis.service";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const sync = await latestDataSync(db);
  if (!sync) return <EmptyState />;
  const analyses = await analyzeSync(db, sync.id);
  return (
    <MatchesView
      analyses={analyses}
      competitions={COMPETITIONS.map((c) => ({ key: c.key, name: c.name }))}
    />
  );
}
