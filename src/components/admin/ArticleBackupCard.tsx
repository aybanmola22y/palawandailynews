"use client";

import { useCallback, useEffect, useState } from "react";
import { DatabaseBackup, Download, Bell } from "lucide-react";
import { adminToast } from "@/lib/admin-toast";
import { formatAdminDateTime } from "@/lib/admin-utils";

type BackupStatus = {
  pendingCount: number;
  lastBackupAt: string | null;
  neverBackedUp: boolean;
  metaConfigured: boolean;
  pendingPreview: { id: string; title: string; created_at: string }[];
};

export function ArticleBackupCard() {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/backup/articles/status", {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body.error === "string" ? body.error : "Could not load backup status",
        );
      }
      const data = (await res.json()) as BackupStatus;
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load backup status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    const interval = setInterval(() => void loadStatus(), 60_000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  function handleDownload() {
    if (!status?.pendingCount) return;
    setDownloading(true);

    const link = document.createElement("a");
    link.href = "/api/admin/backup/articles";
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    const count = status.pendingCount;
    const large = count > 500;

    adminToast.info(
      "Preparing backup…",
      large
        ? `Downloading ${count.toLocaleString()} articles may take 1–2 minutes. Save the CSV when your browser prompts you.`
        : "Your browser will save the CSV file when it is ready.",
    );

    window.setTimeout(() => {
      setDownloading(false);
      void loadStatus();
    }, large ? 120_000 : 45_000);
  }

  const pending = status?.pendingCount ?? 0;
  const hasPending = pending > 0;

  return (
    <section
      className={`border p-6 flex flex-col gap-4 ${
        hasPending
          ? "border-amber-500/50 bg-amber-50/80 dark:bg-amber-950/20"
          : "border-border bg-white dark:bg-[#1A1A18]"
      }`}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              hasPending
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {hasPending ? (
              <Bell className="h-5 w-5" aria-hidden />
            ) : (
              <DatabaseBackup className="h-5 w-5" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-[14px] font-bold uppercase tracking-widest text-foreground">
              Article backup
            </h2>
            {loading ? (
              <p className="text-[13px] text-muted-foreground mt-1 animate-pulse">
                Checking backup status…
              </p>
            ) : error ? (
              <p className="text-[13px] text-primary mt-1">{error}</p>
            ) : hasPending ? (
              <p className="text-[13px] text-foreground mt-1">
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  {pending} new {pending === 1 ? "article" : "articles"}
                </span>{" "}
                {status?.neverBackedUp
                  ? "are ready for your first CSV backup."
                  : "since your last backup — download when you are ready."}
              </p>
            ) : (
              <p className="text-[13px] text-muted-foreground mt-1">
                No new articles waiting.{" "}
                {status?.lastBackupAt
                  ? `Last backup: ${formatAdminDateTime(status.lastBackupAt)}.`
                  : "You are up to date."}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={loading || downloading || !hasPending || Boolean(error)}
          className="inline-flex items-center gap-2 bg-[#111111] text-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Download className="h-4 w-4" />
          {downloading
            ? "Preparing…"
            : hasPending
              ? `Download backup (${pending})`
              : "Download backup"}
        </button>
      </div>

      {!loading && !error && hasPending && status?.pendingPreview?.length ? (
        <ul className="border-t border-amber-500/20 pt-3 space-y-2">
          {status.pendingPreview.map((item) => (
            <li
              key={item.id}
              className="text-[12px] text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5"
            >
              <span className="text-foreground font-medium line-clamp-1">
                {item.title || "Untitled"}
              </span>
              <span>·</span>
              <span>{formatAdminDateTime(item.created_at)}</span>
            </li>
          ))}
          {pending > status.pendingPreview.length ? (
            <li className="text-[11px] text-muted-foreground italic">
              + {pending - status.pendingPreview.length} more
            </li>
          ) : null}
        </ul>
      ) : null}

      {status && !status.metaConfigured ? (
        <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          Run <code className="text-[11px]">scripts/create-article-backup-meta.sql</code> in
          Supabase SQL Editor so &quot;new article&quot; notifications clear after each backup.
        </p>
      ) : null}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Saves a CSV to your laptop (Downloads). Large first backups can take a minute or two.
      </p>
    </section>
  );
}

/** Small badge for sidebar when new articles need backup. */
export function useArticleBackupPending(): number {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/backup/articles/status", {
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as BackupStatus;
        if (!cancelled) setPending(data.pendingCount ?? 0);
      } catch {
        /* ignore */
      }
    }
    void load();
    const interval = setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return pending;
}
