"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SPORT_COOKIE, SPORTS, type Sport } from "@/lib/config";

const ICON: Record<Sport, string> = {
  // Simple outline balls (24×24): soccer pentagon pattern, basketball seams.
  soccer:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7l4 3-1.5 4.5h-5L8 10l4-3zM12 2v5M16 10l5-1.5M14.5 14.5l2.5 4.5M9.5 14.5L7 19M8 10L3 8.5",
  basketball: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2v20M5 5c3 3 3 11 0 14M19 5c-3 3-3 11 0 14",
};

/** One year, whole site; the server reads it on the next render. */
function rememberSport(s: Sport) {
  document.cookie = `${SPORT_COOKIE}=${s}; path=/; max-age=31536000; samesite=lax`;
}

/** Futbol / Basketbol: everything below (matches, suggestions, generator, builder, saved coupons) shows one sport. */
export function SportSwitch({ sport, className = "" }: { sport: Sport; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(s: Sport) {
    if (s === sport) return;
    rememberSport(s);
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label="İdman"
      className={`flex rounded-lg border border-border bg-surface-2 p-0.5 text-sm ${pending ? "opacity-70" : ""} ${className}`}
    >
      {SPORTS.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => pick(s.key)}
          aria-pressed={sport === s.key}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors duration-150 ${
            sport === s.key ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={ICON[s.key]} />
          </svg>
          {s.label}
        </button>
      ))}
    </div>
  );
}
