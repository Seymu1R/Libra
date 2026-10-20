import Link from "next/link";
import { COMPETITIONS } from "@/lib/config";
import { db } from "@/server/db";
import { getStatus } from "@/server/status.service";
import { NavLinks } from "./NavLinks";
import { SyncPanel } from "./SyncPanel";

export async function Header() {
  const status = await getStatus(db);
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            ⚖️ Tərəzi
          </Link>
          <NavLinks />
        </div>
        <SyncPanel
          status={status}
          competitions={COMPETITIONS.map((c) => ({ key: c.key, name: c.name }))}
        />
      </div>
    </header>
  );
}
