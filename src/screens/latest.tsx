"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/editorial/PageHeader";
import { PageShell } from "@/components/editorial/PageShell";
import { LatestSidebar } from "@/components/editorial/LatestSidebar";
import { ArticleListRow } from "@/components/editorial/ArticleListRow";
import { cn } from "@/lib/utils";
import { usePublishedArticles } from "@/hooks/use-published-articles";
import { filterByCategory, paginateArticles } from "@/lib/site-articles";
import type { Article } from "@/store/articles-context";

const CATEGORIES = [
  "All",
  "Environment",
  "Business",
  "Documentary",
  "Lifestyle",
  "Politics",
];

export default function LatestNews() {
  const published = usePublishedArticles();
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  const filtered = useMemo(
    () => filterByCategory(published, activeCategory),
    [published, activeCategory],
  );

  const { items: pageArticles, totalPages } = useMemo(
    () => paginateArticles(filtered, page, perPage),
    [filtered, page],
  );

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <PageShell sidebar={<LatestSidebar />}>
        <PageHeader
          title="Latest News"
          description={`Reporting from across Palawan — environment, business, politics, and community. (${filtered.length} stories)`}
        />

        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Page <span className="text-foreground font-semibold">{page}</span> of{" "}
            <span className="text-foreground font-semibold">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={cn(
                "px-4 py-2 text-[11px] uppercase tracking-[0.12em] font-semibold rounded-sm border transition-colors",
                !canPrev
                  ? "bg-card text-muted-foreground border-border opacity-50 cursor-not-allowed"
                  : "bg-card text-foreground border-border hover:border-foreground/30 hover:text-foreground",
              )}
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className={cn(
                "px-4 py-2 text-[11px] uppercase tracking-[0.12em] font-semibold rounded-sm border transition-colors",
                !canNext
                  ? "bg-card text-muted-foreground border-border opacity-50 cursor-not-allowed"
                  : "bg-card text-foreground border-border hover:border-foreground/30 hover:text-foreground",
              )}
            >
              Next
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 text-[11px] uppercase tracking-[0.08em] font-semibold rounded-sm border transition-colors",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border border-t border-border">
          {pageArticles.map((article: Article) => (
            <ArticleListRow
              key={article.id}
              article={article}
              className="py-8 first:pt-6"
            />
          ))}

          {pageArticles.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-sm">No articles found in this category.</p>
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
}
