"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SYNC_STATUS_LABEL } from "@/lib/labels";
import { formatBaku } from "@/lib/time";
import type { AppStatus } from "@/server/status.service";

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

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  return (
    <div className="flex flex-col gap-2 md:items-end">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {status.mock && (
          <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
            Test məlumatı
          </span>
        )}
        <span className="text-zinc-500 dark:text-zinc-400">
          Son sinxron:{" "}
          <span className="tabular text-zinc-900 dark:text-zinc-100">
            {status.lastSync ? formatBaku(status.lastSync.startedAt) : "—"}
          </span>
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          Kredit:{" "}
          <span className="tabular text-zinc-900 dark:text-zinc-100">{status.creditsRemaining ?? "—"}</span>
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Turnirlər ({selected.length}/{competitions.length})
          </button>
          {open && (
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-1 flex justify-between px-2 text-xs">
                <button type="button" className="text-accent-600" onClick={() => setSelected(competitions.map((c) => c.key))}>
                  Hamısı
                </button>
                <button type="button" className="text-zinc-500" onClick={() => setSelected([])}>
                  Heç biri
                </button>
              </div>
              {competitions.map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <input type="checkbox" checked={selected.includes(c.key)} onChange={() => toggle(c.key)} className="accent-emerald-600" />
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
          className="rounded-md bg-accent-600 px-4 py-1.5 font-medium text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
        >
          {busy || status.running ? "Sinxron gedir…" : "Sinxron et"}
        </button>
      </div>
      {cooling && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Gözləmə: növbəti sinxron {Math.ceil(cooldownMs / 60_000)} dəq sonra ({formatBaku(status.cooldownUntil!)})
        </p>
      )}
      {message && (
        <p className={`text-xs ${message.kind === "ok" ? "text-accent-700 dark:text-accent-500" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      )}
      {status.lastSync && status.lastSync.results.some((r) => r.status === "failed") && !message && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Son sinxronda xəta: {status.lastSync.results.filter((r) => r.status === "failed").map((r) => r.key).join(", ")}
        </p>
      )}
    </div>
  );
}
