"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/editorial/PageShell";
import { SidebarPanel } from "@/components/editorial/SidebarPanel";
import { PopularNewsSidebar } from "@/components/editorial/PopularNewsSidebar";
import { ArticleListRow } from "@/components/editorial/ArticleListRow";
import { PaginatedListTransition } from "@/components/editorial/PaginatedListTransition";
import { usePopularNewsArticles } from "@/hooks/use-popular-news-articles";
import { usePublishedArticles } from "@/hooks/use-published-articles";
import {
  authorProfilePath,
  formatAuthorDisplayName,
  isGenericPublicationAuthor,
} from "@/lib/author-profile";
import { withResolvedArticleImages } from "@/lib/articles/map-article-row";
import { isOpinionOrColumnCategory, paginateArticles } from "@/lib/site-articles";
import type { ColumnistVoice } from "@/components/editorial/ColumnistsVoicesStrip";
import type { Article } from "@/store/articles-context";

const TOPICS = [
  "Environment",
  "Policy",
  "Economy",
  "Tourism",
  "Governance",
  "Rights",
] as const;

function buildColumnists(articles: Article[]): ColumnistVoice[] {
  const byAuthor = new Map<string, Article[]>();
  for (const article of articles) {
    if (isGenericPublicationAuthor(article.author)) continue;
    const list = byAuthor.get(article.author) ?? [];
    list.push(article);
    byAuthor.set(article.author, list);
  }

  return [...byAuthor.entries()]
    .map(([name, pieces]) => ({
      name,
      slug: authorProfilePath(name).replace("/author/", ""),
      pieceCount: pieces.length,
      latestTitle: pieces[0]?.title ?? "",
      latestId: pieces[0]?.id ?? "",
      image: pieces[0]?.image,
      excerpt:
        pieces[0]?.excerpt?.trim() ||
        "Essays and commentary from across Palawan.",
    }))
    .sort((a, b) => b.pieceCount - a.pieceCount);
}

function OpinionSidebar({ voices }: { voices: ColumnistVoice[] }) {
  const published = usePublishedArticles();
  const popularNews = usePopularNewsArticles();
  const latestNews = useMemo(
    () =>
      published
        .filter((a) => !isOpinionOrColumnCategory(a.category))
        .slice(0, 6),
    [published],
  );

  return (
    <div className="flex flex-col gap-10 xl:sticky xl:top-24 xl:self-start">
      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <SidebarPanel title="Latest News">
          {latestNews.length > 0 ? (
            <PopularNewsSidebar articles={latestNews} />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              No stories yet.
            </p>
          )}
        </SidebarPanel>
      </section>

      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <SidebarPanel title="Popular News">
          <PopularNewsSidebar articles={popularNews} />
        </SidebarPanel>
      </section>

      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <SidebarPanel title="Topics">
          <ul className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <li key={topic}>
                <Link
                  href={`/search?q=${encodeURIComponent(topic)}`}
                  className="inline-block rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {topic}
                </Link>
              </li>
            ))}
          </ul>
        </SidebarPanel>
      </section>

      <section className="rounded-sm border border-border bg-foreground p-5 sm:p-6 text-background">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/70 mb-2">
          Newsletter
        </p>
        <p className="font-serif text-xl leading-snug mb-4 text-background">
          Weekly analysis from Palawan&apos;s sharpest voices.
        </p>
        <Link
          href="/advertise"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-background/90 transition-colors hover:text-primary-foreground"
        >
          Get the briefing
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}

function OpinionMasthead({
  storyCount,
  voiceCount,
}: {
  storyCount: number;
  voiceCount: number;
}) {
  return (
    <header className="relative mb-10 overflow-hidden border border-border bg-card">
      <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Palawan Daily News
          </p>
          <h1 className="mt-3 font-serif text-[2.75rem] leading-[0.95] tracking-tight text-foreground md:text-[3.5rem] lg:text-[4rem]">
            Opinion
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-[17px] md:leading-[1.65]">
            Unvarnished perspectives, rigorous analysis, and commentary from
            columnists across Palawan and MIMAROPA.
          </p>
        </div>
        <dl className="flex gap-8 border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Essays
            </dt>
            <dd className="mt-1 font-serif text-3xl text-foreground tabular-nums">
              {storyCount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Voices
            </dt>
            <dd className="mt-1 font-serif text-3xl text-foreground tabular-nums">
              {voiceCount}
            </dd>
          </div>
        </dl>
      </div>
      <div className="h-1 bg-primary" aria-hidden />
    </header>
  );
}

export default function Opinion() {
  const published = usePublishedArticles();
  const [archive, setArchive] = useState<Article[] | null>(null);
  const [page, setPage] = useState(1);
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const perPage = 10;

  const bootstrapOpinion = useMemo(
    () => published.filter((a) => isOpinionOrColumnCategory(a.category)),
    [published],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/articles/opinion", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as Article[];
        if (cancelled || !Array.isArray(data)) return;
        setArchive(withResolvedArticleImages(data));
      } catch {
        /* keep bootstrap slice */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const columnArticles = archive ?? bootstrapOpinion;

  const voices = useMemo(() => buildColumnists(columnArticles), [columnArticles]);

  const filteredArticles = useMemo(() => {
    if (!selectedAuthor) return columnArticles;
    const selected = selectedAuthor.trim().toLowerCase();
    return columnArticles.filter(
      (article) => article.author.trim().toLowerCase() === selected,
    );
  }, [columnArticles, selectedAuthor]);

  const { items: streamArticles, totalPages } = useMemo(
    () => paginateArticles(filteredArticles, page, perPage),
    [filteredArticles, page],
  );

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <PageShell layout="opinion" sidebar={<OpinionSidebar voices={voices} />}>
        <OpinionMasthead
          storyCount={columnArticles.length}
          voiceCount={voices.length}
        />

        <section>
          <div className="mb-8 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                The record
              </p>
              <h2 className="mt-1 font-serif text-2xl text-foreground md:text-3xl">
                {selectedAuthor
                  ? formatAuthorDisplayName(selectedAuthor)
                  : "Latest Opinion"}
              </h2>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <label
                htmlFor="opinion-author-filter"
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Author
              </label>
              <select
                id="opinion-author-filter"
                value={selectedAuthor}
                onChange={(e) => {
                  setSelectedAuthor(e.target.value);
                  setPage(1);
                }}
                className="w-full min-w-[220px] max-w-full border border-border bg-card px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-primary sm:w-auto sm:min-w-[280px]"
              >
                <option value="">
                  All authors ({columnArticles.length})
                </option>
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {formatAuthorDisplayName(voice.name)} ({voice.pieceCount})
                  </option>
                ))}
              </select>
              {totalPages > 1 ? (
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
              ) : null}
            </div>
          </div>

          {streamArticles.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="font-serif text-xl text-foreground">
                No opinion pieces found
              </p>
              <p className="mt-2 text-sm">
                Try selecting another author.
              </p>
            </div>
          ) : (
            <PaginatedListTransition page={page}>
              <div className="divide-y divide-border border-t border-border">
                {streamArticles.map((article: Article) => (
                  <ArticleListRow
                    key={article.id}
                    article={article}
                    className="py-8 first:pt-6"
                  />
                ))}
              </div>
            </PaginatedListTransition>
          )}

          {totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-3 border-t border-border pt-8">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] border border-border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
              >
                Prev
              </button>
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] border border-border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </PageShell>
    </div>
  );
}
