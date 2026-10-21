"use client";

import { useEffect, useRef, useState } from "react";
import { EXPORT_TABLES } from "@/lib/export/tables";

const DOWNLOAD = "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3";

/** "Export" next to "Sinxron et": Excel (all tables, one sheet each) or one table as CSV. Plain download links. */
export function ExportMenu({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block rounded px-2 py-1.5 hover:bg-surface-2";
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="true"
        title={disabled ? "Hələ data yoxdur — əvvəlcə sinxron edin" : "API-dən gələn datanı yüklə"}
        className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-fg transition-colors duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-subtle"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={DOWNLOAD} />
        </svg>
        Export
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-border bg-surface p-2 text-sm shadow-lg">
          <a href="/api/export?format=xlsx" download onClick={() => setOpen(false)} className={item}>
            <span className="font-medium">Excel (.xlsx)</span>
            <span className="block text-xs text-muted">Bütün cədvəllər bir faylda — hər biri ayrı vərəqdə</span>
          </a>
          <div className="my-1 border-t border-border" />
          <p className="px-2 pb-1 pt-1 text-xs font-medium text-muted">CSV — hər cədvəl ayrı fayl</p>
          {EXPORT_TABLES.map((t) => (
            <a key={t.key} href={`/api/export?format=csv&table=${t.key}`} download onClick={() => setOpen(false)} className={item}>
              <span className="font-medium">{t.title}</span>
              <span className="block text-xs text-muted">{t.description}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
