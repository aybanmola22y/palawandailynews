"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Sparkles,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import { PageShell } from "@/components/editorial/PageShell";
import { SidebarPanel } from "@/components/editorial/SidebarPanel";
import { ArticleListRow } from "@/components/editorial/ArticleListRow";
import { usePublishedArticles } from "@/hooks/use-published-articles";
import { usePopularNewsArticles } from "@/hooks/use-popular-news-articles";
import { PopularNewsSidebar } from "@/components/editorial/PopularNewsSidebar";
import { filterByCategory, paginateArticles } from "@/lib/site-articles";
import { cn } from "@/lib/utils";

const TOPICS = [
  { label: "Culture", icon: Sparkles },
  { label: "Dining", icon: UtensilsCrossed },
  { label: "Travel", icon: Compass },
  { label: "Living", icon: Wine },
] as const;

function LifestyleSidebar() {
  const mostRead = usePopularNewsArticles();

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <SidebarPanel title="Most read">
          {mostRead.length > 0 ? (
            <PopularNewsSidebar articles={mostRead} variant="wide" />
          ) : (
            <p className="text-sm text-muted-foreground">Loading stories…</p>
          )}
        </SidebarPanel>
      </section>

      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <SidebarPanel title="Explore">
          <ul className="flex flex-wrap gap-2">
            {["Culture", "Dining", "Travel", "Wellness", "Events", "Profiles"].map(
              (topic) => (
                <li key={topic}>
                  <Link
                    href="/search"
                    className="inline-block px-2.5 py-1 text-[11px] uppercase tracking-wide border border-border rounded-sm hover:border-primary hover:text-primary transition-colors"
                  >
                    {topic}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </SidebarPanel>
      </section>

      <section className="rounded-sm border border-border bg-secondary/50 p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary mb-2">
          Partner with us
        </p>
        <p className="font-serif text-lg leading-snug mb-4">
          Put your brand in front of Palawan&apos;s lifestyle audience.
        </p>
        <Link
          href="/advertise"
          className="inline-block text-[11px] uppercase tracking-widest font-semibold text-foreground border-b border-foreground pb-0.5 hover:text-primary hover:border-primary transition-colors"
        >
          View ad options →
        </Link>
      </section>
    </div>
  );
}

export default function Lifestyle() {
  const published = usePublishedArticles();
  const allLifestyle = useMemo(
    () => filterByCategory(published, "Lifestyle"),
    [published],
  );
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    setPage(1);
  }, [allLifestyle.length]);

  const { items: lifestyleArticles, totalPages } = useMemo(
    () => paginateArticles(allLifestyle, page, perPage),
    [allLifestyle, page],
  );

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="min-h-screen bg-background">
      <div className="editorial-container py-8 md:py-10">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Palawan Daily News · MIMAROPA
          </p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05]">
            Lifestyle
          </h1>
          <p className="mt-4 text-[15px] md:text-base leading-relaxed text-muted-foreground">
            Culture, dining, travel, and living — the stories that shape how Palawan
            lives and entertains.
          </p>
        </motion.header>

        <section className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-4">
          {TOPICS.map((topic) => (
            <Link
              key={topic.label}
              href="/search"
              className="editorial-card p-4 md:p-5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                <topic.icon className="h-4 w-4" />
                {topic.label}
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Stories on {topic.label.toLowerCase()} across Palawan and MIMAROPA.
              </p>
            </Link>
          ))}
        </section>

        <div className="mt-8">
          <PageShell layout="wideSidebar" sidebar={<LifestyleSidebar />}>
            {lifestyleArticles.length === 0 ? (
              <div className="editorial-card p-8 text-center text-muted-foreground">
                No lifestyle stories yet. Import articles with category
                &quot;Lifestyle&quot;.
              </div>
            ) : (
              <div className="divide-y divide-border border-t border-border">
                {lifestyleArticles.map((article) => (
                  <ArticleListRow
                    key={article.id}
                    article={article}
                    className="py-8 first:pt-6"
                  />
                ))}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-8">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Page <span className="text-foreground font-semibold">{page}</span> of{" "}
                <span className="text-foreground font-semibold">{totalPages || 1}</span>
                {allLifestyle.length > 0 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {allLifestyle.length} stories
                  </span>
                ) : null}
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
      </div>
    </div>
  );
}
