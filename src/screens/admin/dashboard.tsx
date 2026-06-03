"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { formatAdminDateTime } from "@/lib/admin-utils";
import type { Article } from "@/types/article";

const PublishingActivityChart = dynamic(
  () =>
    import("@/components/admin/PublishingActivityChart").then(
      (m) => m.PublishingActivityChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="lg:col-span-2 bg-white dark:bg-[#1A1A18] border border-border p-6 min-h-[380px] animate-pulse" />
    ),
  },
);

type DashboardOverview = {
  counts: {
    published: number;
    drafts: number;
    review: number;
    total: number;
  };
  recentPublished: Article[];
  latestByDate: Article[];
  topTags: { tag: string; count: number }[];
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/dashboard/overview", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: DashboardOverview) => {
        if (!cancelled) {
          setOverview(data);
          setOverviewError(null);
        }
      })
      .catch(async (err) => {
        if (cancelled) return;
        try {
          const text =
            typeof err?.text === "function" ? await err.text() : String(err);
          setOverviewError(text || "Failed to load dashboard");
        } catch {
          setOverviewError("Failed to load dashboard");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = overview?.counts;
  const cmsPublished = counts?.published ?? "—";
  const cmsDrafts = counts?.drafts ?? "—";
  const cmsReview = counts?.review ?? "—";
  const cmsTotal = counts?.total ?? "—";
  const cmsRecent = overview?.recentPublished ?? [];
  const cmsLatest = overview?.latestByDate ?? [];
  const topTags = overview?.topTags ?? [];

  const fallbackDaily = Math.max(
    typeof counts?.published === "number" ? counts.published / 30 : 1,
    1,
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="mb-4 border-b border-border pb-6">
        <h1 className="font-serif text-[32px] font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Overview of published stories and editorial workflow.
          {overviewError ? (
            <span className="block text-primary mt-1">{overviewError}</span>
          ) : null}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link
          href="/admin/articles?status=Published"
          className="bg-white dark:bg-[#1A1A18] border border-border p-6 flex flex-col hover:border-primary/40 transition-colors"
        >
          <div className="text-muted-foreground text-[11px] uppercase tracking-widest font-bold mb-2">
            Published
          </div>
          <div className="font-serif text-[36px] font-bold text-foreground">
            {cmsPublished}
          </div>
          <span className="text-[11px] text-muted-foreground mt-2">
            Live on the public site
          </span>
        </Link>
        <Link
          href="/admin/articles?status=Draft"
          className="bg-white dark:bg-[#1A1A18] border border-border p-6 flex flex-col hover:border-primary/40 transition-colors"
        >
          <div className="text-muted-foreground text-[11px] uppercase tracking-widest font-bold mb-2">
            Drafts
          </div>
          <div className="font-serif text-[36px] font-bold text-foreground">
            {cmsDrafts}
          </div>
          <span className="text-[11px] text-muted-foreground mt-2">
            Not visible on site
          </span>
        </Link>
        <Link
          href="/admin/articles?status=Review"
          className="bg-white dark:bg-[#1A1A18] border border-border p-6 flex flex-col hover:border-primary/40 transition-colors"
        >
          <div className="text-muted-foreground text-[11px] uppercase tracking-widest font-bold mb-2">
            Pending Review
          </div>
          <div className="font-serif text-[36px] font-bold text-foreground">
            {cmsReview}
          </div>
        </Link>
        <Link
          href="/admin/articles"
          className="bg-white dark:bg-[#1A1A18] border border-border p-6 flex flex-col hover:border-primary/40 transition-colors"
        >
          <div className="text-muted-foreground text-[11px] uppercase tracking-widest font-bold mb-2">
            All Articles
          </div>
          <div className="font-serif text-[36px] font-bold text-foreground">
            {cmsTotal}
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PublishingActivityChart days={30} fallbackDaily={fallbackDaily} />

        <div className="lg:col-span-1 bg-white dark:bg-[#1A1A18] border border-border p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-bold uppercase tracking-widest">
              Latest articles
            </h2>
            <Link
              href="/admin/articles"
              className="text-[11px] font-bold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-col flex-1 gap-0">
            {!overview && !overviewError && (
              <p className="text-[13px] text-muted-foreground animate-pulse">
                Loading…
              </p>
            )}
            {overview && cmsLatest.length === 0 && (
              <p className="text-[13px] text-muted-foreground">
                No articles yet.{" "}
                <Link href="/admin/articles/new" className="text-primary hover:underline">
                  Create an article
                </Link>
              </p>
            )}
            {cmsLatest.map((article) => (
              <div
                key={article.id}
                className="flex gap-4 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span
                      className={
                        article.status === "Published"
                          ? "text-green-700 dark:text-green-400"
                          : "text-amber-700 dark:text-amber-400"
                      }
                    >
                      {article.status || "Draft"}
                    </span>
                    <span>·</span>
                    <span>{article.author || "Unknown author"}</span>
                  </div>
                  {article.status === "Published" ? (
                    <Link
                      href={`/article/${article.id}`}
                      target="_blank"
                      className="text-[13px] font-serif text-foreground mt-1 line-clamp-2 hover:text-primary transition-colors inline-flex items-start gap-1"
                    >
                      {article.title || "Untitled"}
                      <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="text-[13px] font-serif text-foreground mt-1 line-clamp-2 hover:text-primary transition-colors"
                    >
                      {article.title || "Untitled"}
                    </Link>
                  )}
                  <span className="text-[11px] text-muted-foreground mt-2">
                    Published {formatAdminDateTime(article.date)}
                    {article.category ? ` · ${article.category}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1A18] border border-border p-6">
        <h2 className="text-[14px] font-bold uppercase tracking-widest mb-4">
          Top tags
        </h2>
        {topTags.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            {overview ? "No tags yet." : "Loading…"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topTags.map(({ tag, count }) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 text-[11px] uppercase tracking-wider"
              >
                <span className="font-semibold text-foreground">{tag}</span>
                <span className="text-muted-foreground">{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {cmsRecent.length > 0 && (
        <div className="bg-white dark:bg-[#1A1A18] border border-border p-6">
          <h2 className="text-[14px] font-bold uppercase tracking-widest mb-4">
            Recently Published
          </h2>
          <ul className="divide-y divide-border">
            {cmsRecent.map((article) => (
              <li key={article.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/article/${article.id}`}
                  target="_blank"
                  className="font-serif text-[15px] hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {article.title || "Untitled"}
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                </Link>
                <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">
                  {formatAdminDateTime(article.date)} · {article.category}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
