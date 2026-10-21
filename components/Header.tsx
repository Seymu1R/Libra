import Link from "next/link";
import { COMPETITIONS } from "@/lib/config";
import { db } from "@/server/db";
import { getStatus } from "@/server/status.service";
import { currentSport } from "@/app/current-sport";
import { NavLinks } from "./NavLinks";
import { SportSwitch } from "./SportSwitch";
import { SyncPanel } from "./SyncPanel";
import { ThemeToggle } from "./ThemeToggle";

export async function Header() {
  const [status, sport] = await Promise.all([getStatus(db), currentSport()]);
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4">
        {/* Row 1: brand, pages, theme */}
        <div className="flex items-center gap-2 py-3 sm:gap-4 md:gap-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ScaleIcon />
            Tərəzi
          </Link>
          <NavLinks />
          <ThemeToggle className="ml-auto" />
        </div>
        {/* Row 2: what is shown (sport) on the left, data actions on the right */}
        <div className="flex flex-col gap-3 border-t border-border py-3 lg:flex-row lg:items-start lg:justify-between">
          <SportSwitch sport={sport} className="self-start" />
          <SyncPanel status={status} competitions={COMPETITIONS.map((c) => ({ key: c.key, name: c.name }))} />
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
