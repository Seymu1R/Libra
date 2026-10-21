"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SYNC_STATUS_LABEL } from "@/lib/labels";
import { formatBaku } from "@/lib/time";
import type { AppStatus } from "@/server/status.service";
import { ExportMenu } from "./ExportMenu";

interface Props {
  status: AppStatus;
  competitions: { key: string; name: string }[];
}

/** 0 until mounted, so server and client render the same markup (no hydration mismatch). */
function useNow(intervalMs: number) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

export function SyncPanel({ status, competitions }: Props) {
  const router = useRouter();
  const now = useNow(15_000);
  const [selected, setSelected] = useState<string[]>(competitions.map((c) => c.key));
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const cooldownMs = status.cooldownUntil && now > 0 ? new Date(status.cooldownUntil).getTime() - now : 0;
  const cooling = cooldownMs > 0;
  const disabled = busy || status.running || cooling || selected.length === 0;

  async function sync() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitions: selected.length === competitions.length ? [] : selected }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage({ kind: "error", text: body.error ?? "Xəta baş verdi." });
      } else {
        const failed = (body.results as { status: string }[]).filter((r) => r.status === "failed").length;
        setMessage({
          kind: failed ? "error" : "ok",
          text: `Sinxronizasiya ${SYNC_STATUS_LABEL[body.status] ?? body.status}. İstifadə olunan kredit: ${body.creditsUsed}${failed ? ` · ${failed} turnirdə xəta` : ""}`,
        });
      }
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Serverə qoşulmaq mümkün olmadı." });
    } finally {
      setBusy(false);
    }
  }

  // Close the competition menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  return (
    <div className="flex flex-col gap-2 md:items-end">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {status.mock && (
          <span className="rounded bg-info-bg px-2 py-0.5 text-xs font-medium text-info-fg">
            Test məlumatı
          </span>
        )}
        <span className="text-muted">
          Son sinxron:{" "}
          <span className="tabular text-fg">
            {status.lastSync ? formatBaku(status.lastSync.startedAt) : "—"}
          </span>
        </span>
        <span className="text-muted">
          Kredit:{" "}
          <span className="tabular text-fg">{status.creditsRemaining ?? "—"}</span>
        </span>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="rounded-md border border-border-strong px-3 py-2 text-fg transition-colors duration-150 hover:bg-surface-2"
          >
            Turnirlər ({selected.length}/{competitions.length})
          </button>
          {open && (
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-border bg-surface p-2 shadow-lg">
              <div className="mb-1 flex justify-between px-2 text-xs">
                <button type="button" className="text-primary-fg hover:underline" onClick={() => setSelected(competitions.map((c) => c.key))}>
                  Hamısı
                </button>
                <button type="button" className="text-muted hover:underline" onClick={() => setSelected([])}>
                  Heç biri
                </button>
              </div>
              {competitions.map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-2">
                  <input type="checkbox" checked={selected.includes(c.key)} onChange={() => toggle(c.key)} className="accent-primary" />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={sync}
          disabled={disabled}
          className="rounded-md bg-primary px-4 py-2 font-medium text-on-primary transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-subtle"
        >
          {busy || status.running ? "Sinxron gedir…" : "Sinxron et"}
        </button>
        <ExportMenu disabled={!status.lastSync} />
      </div>
      {cooling && (
        <p className="text-xs text-muted">
          Gözləmə: növbəti sinxron {Math.ceil(cooldownMs / 60_000)} dəq sonra ({formatBaku(status.cooldownUntil!)})
        </p>
      )}
      {message && (
        <p className={`text-xs ${message.kind === "ok" ? "text-highlight" : "text-danger"}`}>
          {message.text}
        </p>
      )}
      {status.lastSync && status.lastSync.results.some((r) => r.status === "failed") && !message && (
        <p className="text-xs text-danger">
          Son sinxronda xəta: {status.lastSync.results.filter((r) => r.status === "failed").map((r) => r.key).join(", ")}
        </p>
      )}
    </div>
  );
}
