"use client";

import { legalNotices } from "@/data/legal";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { HeaderAdBanner } from "@/components/ads/HeaderAdBanner";
import { HomepageMidBanner } from "@/components/ads/HomepageMidBanner";
import { HomepageLatestNewsSidebarAd } from "@/components/ads/HomepageLatestNewsSidebarAd";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { DividerLabel } from "@/components/editorial/DividerLabel";
import { ArticleListRow } from "@/components/editorial/ArticleListRow";
import { ArticleBylineMeta } from "@/components/editorial/ArticleByline";
import { PopularNewsSidebar } from "@/components/editorial/PopularNewsSidebar";
import { usePublishedArticles } from "@/hooks/use-published-articles";
import { useArticles } from "@/store/articles-context";
import { usePopularNewsArticles } from "@/hooks/use-popular-news-articles";
import { filterByCategory } from "@/lib/site-articles";
import type { Article } from "@/store/articles-context";

export default function Home() {
  const { loading } = useArticles();
  const published = usePublishedArticles();
  const popularNews = usePopularNewsArticles();

  const featured = published[0] ?? null;
  const latestStrip = useMemo(() => {
    if (!featured) return published.slice(0, 4);
    return published.slice(1, 5);
  }, [published, featured]);
  const lifestyleArticles = useMemo(
    () => filterByCategory(published, "Lifestyle"),
    [published],
  );
  const opinionArticles = useMemo(
    () =>
      published
        .filter((a) => {
          const cat = a.category.toLowerCase();
          return cat === "column" || cat === "opinion";
        })
        .slice(0, 3),
    [published],
  );

  const ready = published.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ready ? 0.2 : 0 }}
      className="min-h-screen pt-[76px]"
    >
      <HeaderAdBanner />
      <div className="editorial-container py-8 md:py-12">
        {!ready && loading && (
          <div className="mb-8 animate-pulse space-y-6" aria-hidden>
            <div className="aspect-[3/2] max-w-3xl rounded-sm bg-muted" />
            <div className="h-10 max-w-2xl rounded-sm bg-muted" />
            <div className="h-4 max-w-xl rounded-sm bg-muted/80" />
          </div>
        )}
        {!ready && !loading && (
          <div className="mb-6 border border-border bg-card px-4 py-3 text-[13px] text-muted-foreground leading-relaxed">
            No articles yet. Import content into Supabase or add articles in the admin
            dashboard, then refresh.
          </div>
        )}
        {ready && (
          <>
            {/* Hero */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-4">
          <div className="lg:col-span-7 flex flex-col">
            <Link href={`/article/${featured.id}`} className="group block flex-1">
              <div className="image-zoom relative mb-5 aspect-[3/2] overflow-hidden rounded-sm bg-background">
                {featured.image ? (
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-contain bg-background"
                  />
                ) : (
                  <div className="h-full w-full bg-linear-to-br from-[#111111] via-[#5c1828] to-[#C41E3A]" />
                )}
              </div>
              <SectionLabel>{featured.category}</SectionLabel>
              <h1 className="font-serif text-3xl md:text-[2.75rem] lg:text-5xl leading-[1.08] mt-2 mb-4">
                {featured.title}
              </h1>
              <p className="text-muted-foreground text-base md:text-[17px] leading-relaxed mb-4 line-clamp-3">
                {featured.excerpt}
              </p>
            </Link>
            <ArticleBylineMeta
              author={featured.author}
              date={featured.date}
              className="text-[11px] tracking-[0.12em]"
            />
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-4 pb-3 border-b border-border">
              Popular News
            </p>
            <PopularNewsSidebar articles={popularNews} variant="wide" className="flex-1" />
          </div>
        </section>

        <DividerLabel label="Latest News" />

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(400px,28%)] 2xl:grid-cols-[minmax(0,1fr)_minmax(460px,30%)] gap-8 xl:gap-12 items-stretch">
          <section className="min-w-0 divide-y divide-border border-t border-border">
            {latestStrip.map((article: Article) => (
              <ArticleListRow
                key={article.id}
                article={article}
                className="py-8 first:pt-6"
              />
            ))}
          </section>
          <HomepageLatestNewsSidebarAd className="flex w-full min-h-[520px] xl:min-h-0 xl:h-full" />
        </div>

        <div className="flex justify-center mt-2 mb-2">
          <Link
            href="/latest"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] border border-border rounded-sm hover:border-primary hover:text-primary transition-colors"
          >
            Browse all latest stories
          </Link>
        </div>
          </>
        )}
      </div>

      {ready && (
        <>
          {/* Opinion */}
          <section className="bg-secondary/50 border-y border-border py-14 md:py-16">
            <div className="editorial-container">
              <SectionHeading title="Opinion & Commentary" href="/opinion" />
              <div className="divide-y divide-border border-t border-border">
                {opinionArticles.map((article: Article) => (
                  <ArticleListRow
                    key={article.id}
                    article={article}
                    className="py-8 first:pt-6"
                  />
                ))}
              </div>
            </div>
          </section>

          <div className="editorial-container py-14 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
              <section className="lg:col-span-4">
                <SectionHeading title="Legal Notices" href="/legal" linkLabel="Registry" />
                <div className="flex flex-col gap-0 divide-y divide-border">
                  {legalNotices.slice(0, 5).map((notice) => (
                    <div key={notice.id} className="py-4 first:pt-0">
                      <div className="flex justify-between items-center gap-2 mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span>{notice.date}</span>
                        <span className="font-mono text-[9px]">{notice.id}</span>
                      </div>
                      <h3 className="text-sm font-medium leading-snug mb-2 pr-2">
                        {notice.title}
                      </h3>
                      <Link
                        href="/legal"
                        className="text-[10px] uppercase tracking-wider font-semibold text-primary hover:underline"
                      >
                        View notice →
                      </Link>
                    </div>
                  ))}
                </div>
              </section>

              <section className="lg:col-span-8">
                <SectionHeading title="Lifestyle" href="/lifestyle" />
                {lifestyleArticles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No lifestyle stories loaded right now.{" "}
                    <Link href="/lifestyle" className="text-primary hover:underline">
                      View lifestyle →
                    </Link>
                  </p>
                ) : (
                  <div className="divide-y divide-border border-t border-border">
                    {lifestyleArticles.slice(0, 3).map((article: Article) => (
                      <ArticleListRow
                        key={article.id}
                        article={article}
                        className="py-8 first:pt-6"
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <HomepageMidBanner />
          </div>
        </>
      )}
    </motion.div>
  );
}
