import Link from "next/link";
import { COMPETITIONS } from "@/lib/config";
import { db } from "@/server/db";
import { getStatus } from "@/server/status.service";
import { NavLinks } from "./NavLinks";
import { SyncPanel } from "./SyncPanel";
import { ThemeToggle } from "./ThemeToggle";

export async function Header() {
  const status = await getStatus(db);
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ScaleIcon />
            Tərəzi
          </Link>
          <NavLinks />
          <ThemeToggle className="ml-auto md:hidden" />
        </div>
        <div className="flex items-start gap-3">
          <SyncPanel
            status={status}
            competitions={COMPETITIONS.map((c) => ({ key: c.key, name: c.name }))}
          />
          <ThemeToggle className="hidden md:flex" />
        </div>
      </div>
    </header>
  );
}

function ScaleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 text-primary-fg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v18M7 21h10M5 7h14M12 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
      <path d="M5 7l-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z" />
    </svg>
  );
}
