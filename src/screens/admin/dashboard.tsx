"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useArticles } from "@/store/articles-context";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ArrowRight, ExternalLink } from "lucide-react";
import {
  formatAdminDateTime,
  sortArticlesByRecent,
} from "@/lib/admin-utils";

export default function AdminDashboard() {
  const { articles } = useArticles();

  const cmsDrafts = articles.filter((a) => a.status === "Draft").length;
  const cmsReview = articles.filter((a) => a.status === "Review").length;
  const cmsTotal = articles.length;
  const cmsPublished = articles.filter((a) => a.status === "Published").length;

  const cmsRecent = useMemo(
    () =>
      sortArticlesByRecent(articles)
        .filter((a) => a.status === "Published")
        .slice(0, 6),
    [articles],
  );

  /** Latest by publication date — not a real audit log of who clicked Save. */
  const cmsLatest = useMemo(
    () =>
      [...articles]
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .filter((a) => !Number.isNaN(Date.parse(a.date)))
        .slice(0, 6),
    [articles],
  );

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) {
      for (const tag of a.tags ?? []) {
        const key = tag.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [articles]);

  const trafficData = useMemo(() => {
    const base = Math.max(cmsPublished / 7, 2);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((name, i) => ({
      name,
      views: Math.round(base * (0.7 + ((i * 17) % 10) / 10)),
    }));
  }, [cmsPublished]);

  return (
    <div className="flex flex-col gap-8">
      <header className="mb-4 border-b border-border pb-6">
        <h1 className="font-serif text-[32px] font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Overview of published stories and editorial workflow.
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
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1A18] border border-border p-6">
          <h2 className="text-[14px] font-bold uppercase tracking-widest mb-1">
            Traffic Over Time
          </h2>
          <p className="text-[11px] text-muted-foreground mb-6">
            Placeholder chart — not real analytics yet.
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  stroke="var(--color-muted-foreground)"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  stroke="var(--color-muted-foreground)"
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 0,
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#C41E3A"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#C41E3A" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

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
            {cmsLatest.length === 0 && (
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
            No tags yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
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
