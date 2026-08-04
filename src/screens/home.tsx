"use client";

import { legalNotices } from "@/data/legal";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, Wine } from "lucide-react";
import { EditorialImage } from "@/components/editorial/EditorialImage";
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
import {
  filterByCategory,
  formatArticleDate,
  isOpinionOrColumnCategory,
} from "@/lib/site-articles";
import {
  authorProfilePath,
  formatAuthorDisplayName,
  isGenericPublicationAuthor,
} from "@/lib/author-profile";
import type { Article } from "@/store/articles-context";
import { cn } from "@/lib/utils";

function LifestyleByline({
  author,
  date,
  className,
}: {
  author?: string;
  date?: string;
  className?: string;
}) {
  const rawAuthor = author?.trim() ?? "";
  const displayAuthor = rawAuthor ? formatAuthorDisplayName(rawAuthor) : "";
  const dateLabel = date ? formatArticleDate(date) : "";
  if (!displayAuthor && !dateLabel) return null;

  return (
    <p
      className={cn(
        "mt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
        className,
      )}
    >
      {displayAuthor && !isGenericPublicationAuthor(rawAuthor) ? (
        <Link
          href={`${authorProfilePath(rawAuthor)}?name=${encodeURIComponent(displayAuthor)}`}
          className="hover:text-primary transition-colors"
        >
          {displayAuthor}
        </Link>
      ) : displayAuthor ? (
        <span>{displayAuthor}</span>
      ) : null}
      {displayAuthor && dateLabel ? " · " : null}
      {dateLabel}
    </p>
  );
}

export default function Home() {
  const { loading, error } = useArticles();
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
  const lifestyleLead = lifestyleArticles[0] ?? null;
  const lifestyleRest = lifestyleArticles.slice(1, 3);
  const opinionArticles = useMemo(
    () =>
      published
        .filter((a) => isOpinionOrColumnCategory(a.category))
        .slice(0, 3),
    [published],
  );
  const featuredNotices = useMemo(() => legalNotices.slice(0, 3), []);

  const ready = published.length > 0;

  return (
    <div className="min-h-screen">
      <HeaderAdBanner />
      <div className="editorial-container pt-4 pb-8 md:pt-6 md:pb-12">
        {!ready && loading && (
          <div className="mb-8 animate-pulse space-y-6" aria-hidden>
            <div className="aspect-3/2 max-w-3xl rounded-sm bg-muted" />
            <div className="h-10 max-w-2xl rounded-sm bg-muted" />
            <div className="h-4 max-w-xl rounded-sm bg-muted/80" />
          </div>
        )}
        {!ready && !loading && (
          <div className="mb-6 border border-border bg-card px-4 py-3 text-[13px] text-muted-foreground leading-relaxed">
            {error ? (
              <>
                <span className="font-semibold text-foreground">Could not load articles.</span>{" "}
                {error}
                {error.toLowerCase().includes("402") ||
                error.toLowerCase().includes("quota") ||
                error.toLowerCase().includes("egress") ? (
                  <span className="block mt-2">
                    Your Supabase project may be restricted (free plan egress exceeded).
                    Check the Supabase dashboard → Usage, then upgrade or wait for the billing
                    period to reset.
                  </span>
                ) : null}
              </>
            ) : (
              <>
                No articles yet. Import content into Supabase or add articles in the admin
                dashboard, then refresh.
              </>
            )}
          </div>
        )}
        {ready && (
          <>
            {/* Hero */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-4">
          <div className="lg:col-span-7 flex flex-col">
            <Link href={`/article/${featured.id}`} prefetch={false} className="group block">
              <div className="image-zoom relative mb-5 aspect-3/2 overflow-hidden rounded-sm bg-background">
                <EditorialImage
                  src={featured.image}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  fit="contain"
                />
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
              className="mt-3 text-[11px] tracking-[0.12em]"
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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(400px,28%)] 2xl:grid-cols-[minmax(0,1fr)_minmax(460px,30%)] gap-8 xl:gap-12 items-start">
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

          <div className="border-y border-border bg-[#FAF9F7] dark:bg-[#121210]">
            <div className="editorial-container py-14 md:py-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 items-start">
                {/* Legal Notices */}
                <section className="lg:col-span-4 lg:pr-10 xl:pr-14">
                  <div className="flex items-end justify-between gap-4 border-b border-border pb-4 mb-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                        Public record
                      </p>
                      <h2 className="font-serif text-2xl md:text-[28px] tracking-tight text-foreground">
                        Legal Notices
                      </h2>
                    </div>
                    <Link
                      href="/legal"
                      className="shrink-0 mb-1 text-[11px] uppercase tracking-[0.12em] font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      Registry →
                    </Link>
                  </div>

                  <ul className="divide-y divide-border">
                    {featuredNotices.map((notice) => (
                      <li key={notice.id} className="group py-5 first:pt-4">
                        <div className="flex items-center justify-between gap-3 mb-2.5">
                          <time className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                            {notice.date}
                          </time>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                notice.status === "Active"
                                  ? "bg-primary"
                                  : "bg-muted-foreground/40",
                              )}
                              aria-hidden
                            />
                            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                              {notice.id}
                            </span>
                          </span>
                        </div>
                        <h3 className="font-serif text-[17px] leading-snug text-foreground transition-colors group-hover:text-primary">
                          <Link href="/legal" className="hover:underline underline-offset-2">
                            {notice.title}
                          </Link>
                        </h3>
                        <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">
                          {notice.agency}
                        </p>
                        <Link
                          href="/legal"
                          className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] font-bold text-primary hover:gap-2.5 transition-all"
                        >
                          View notice
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Lifestyle */}
                <section className="lg:col-span-8 lg:border-l lg:border-border lg:pl-10 xl:pl-14">
                  <div className="flex items-end justify-between gap-4 border-b border-border pb-4 mb-8">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                        Culture & living
                      </p>
                      <h2 className="font-serif text-2xl md:text-[28px] tracking-tight text-foreground">
                        Lifestyle
                      </h2>
                    </div>
                    <Link
                      href="/lifestyle"
                      className="shrink-0 mb-1 text-[11px] uppercase tracking-[0.12em] font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      View all →
                    </Link>
                  </div>

                  {!lifestyleLead ? (
                    <div className="relative overflow-hidden rounded-sm border border-dashed border-border bg-card/60 px-6 py-12 md:px-10 md:py-14">
                      <div
                        className="pointer-events-none absolute inset-0 opacity-60"
                        style={{
                          backgroundImage:
                            "radial-gradient(ellipse 70% 80% at 100% 0%, rgba(196,30,58,0.06), transparent 55%)",
                        }}
                        aria-hidden
                      />
                      <div className="relative max-w-md">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-primary">
                          <Wine className="h-4 w-4" aria-hidden />
                        </div>
                        <p className="mt-5 font-serif text-xl text-foreground leading-snug">
                          Lifestyle stories are on the way.
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                          Features on culture, travel, food, and island living will appear
                          here as they publish.
                        </p>
                        <Link
                          href="/lifestyle"
                          className="mt-6 inline-flex items-center gap-2 border border-border bg-background px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          Browse lifestyle
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
                      <article className="md:col-span-7 group">
                        <Link
                          href={`/article/${lifestyleLead.id}`}
                          prefetch={false}
                          className="block"
                        >
                          <div className="image-zoom relative mb-5 aspect-[16/10] overflow-hidden rounded-sm border border-border bg-background">
                            <EditorialImage
                              src={lifestyleLead.image}
                              alt={lifestyleLead.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 40vw"
                              fit="cover"
                            />
                          </div>
                          <SectionLabel>{lifestyleLead.category}</SectionLabel>
                          <h3 className="mt-2 font-serif text-2xl md:text-[1.75rem] leading-[1.15] text-foreground transition-colors group-hover:text-primary">
                            {lifestyleLead.title}
                          </h3>
                          {lifestyleLead.excerpt ? (
                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                              {lifestyleLead.excerpt}
                            </p>
                          ) : null}
                        </Link>
                        <LifestyleByline
                          author={lifestyleLead.author}
                          date={lifestyleLead.date}
                        />
                      </article>

                      <div className="md:col-span-5 flex flex-col divide-y divide-border border-t border-border md:border-t-0">
                        {lifestyleRest.length > 0 ? (
                          lifestyleRest.map((article) => (
                            <article key={article.id} className="group py-5 first:pt-0 md:first:pt-1">
                              <Link
                                href={`/article/${article.id}`}
                                prefetch={false}
                                className="block"
                              >
                                <SectionLabel className="mb-2">
                                  {article.category}
                                </SectionLabel>
                                <h3 className="font-serif text-lg leading-snug text-foreground transition-colors group-hover:text-primary">
                                  {article.title}
                                </h3>
                              </Link>
                              <LifestyleByline
                                author={article.author}
                                date={article.date}
                                className="mt-2.5"
                              />
                            </article>
                          ))
                        ) : (
                          <div className="py-2 text-sm text-muted-foreground leading-relaxed">
                            More lifestyle coverage will fill this column as new stories
                            publish.{" "}
                            <Link
                              href="/lifestyle"
                              className="font-medium text-primary hover:underline"
                            >
                              View all →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <HomepageMidBanner />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
