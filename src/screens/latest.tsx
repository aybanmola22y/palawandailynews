"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/editorial/PageHeader";
import { PageShell } from "@/components/editorial/PageShell";
import { LatestSidebar } from "@/components/editorial/LatestSidebar";
import { ArticleListRow } from "@/components/editorial/ArticleListRow";
import { PaginatedListTransition } from "@/components/editorial/PaginatedListTransition";
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
] as const;

type Category = (typeof CATEGORIES)[number];

function resolveCategory(topic: string): Category {
  if (!topic) return "All";
  const match = CATEGORIES.find((c) => c.toLowerCase() === topic.toLowerCase());
  return match ?? "All";
}

function LatestNewsContent() {
  const published = usePublishedArticles();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const topicFromUrl = searchParams.get("topic")?.trim() ?? "";
  const activeCategory = resolveCategory(topicFromUrl);
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  function selectCategory(cat: Category) {
    setPage(1);
    if (cat === "All") {
      router.replace(pathname, { scroll: false });
      return;
    }
    router.replace(`${pathname}?topic=${encodeURIComponent(cat)}`, {
      scroll: false,
    });
  }

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
          description="Daily coverage from Puerto Princesa and across the province — breaking news, local government, business, environment, lifestyle, and community life. Browse by topic below."
        />

        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => selectCategory(cat)}
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

        <PaginatedListTransition page={page}>
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
        </PaginatedListTransition>

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-8">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Page <span className="text-foreground font-semibold">{page}</span> of{" "}
            <span className="text-foreground font-semibold">{totalPages || 1}</span>
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
      </PageShell>
    </div>
  );
}

export default function LatestNews() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background pt-8 pb-20 site-gutter">
          <div className="h-10 w-48 animate-pulse rounded-sm bg-muted" />
          <div className="mt-6 h-4 w-full max-w-xl animate-pulse rounded-sm bg-muted/80" />
        </div>
      }
    >
      <LatestNewsContent />
    </Suspense>
  );
}
