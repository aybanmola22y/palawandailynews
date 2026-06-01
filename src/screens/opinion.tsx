"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Quote } from "lucide-react";
import { PageShell } from "@/components/editorial/PageShell";
import { SidebarPanel } from "@/components/editorial/SidebarPanel";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { ArticleBylineMeta } from "@/components/editorial/ArticleByline";
import { PopularNewsSidebar } from "@/components/editorial/PopularNewsSidebar";
import { ArticleCardImage } from "@/components/editorial/ArticleCardImage";
import { ArticleListImage } from "@/components/editorial/ArticleListImage";
import { usePopularNewsArticles } from "@/hooks/use-popular-news-articles";
import { usePublishedArticles } from "@/hooks/use-published-articles";
import {
  authorProfilePath,
  isGenericPublicationAuthor,
} from "@/lib/author-profile";
import { formatArticleDate, paginateArticles } from "@/lib/site-articles";
import { cn } from "@/lib/utils";
import type { Article } from "@/store/articles-context";

const TOPICS = [
  "Environment",
  "Policy",
  "Economy",
  "Tourism",
  "Governance",
  "Rights",
] as const;

const VOICE_GRADIENTS = [
  "from-[#141414] via-[#4a1828] to-[#9e1b32]",
  "from-[#0f172a] via-[#1e3a5f] to-[#3d5a80]",
  "from-[#1a1410] via-[#5c3d1e] to-[#8b6914]",
  "from-[#121816] via-[#1f4031] to-[#2d6a4f]",
  "from-[#1a1218] via-[#4a2540] to-[#6b3a5c]",
] as const;

function voiceGradientIndex(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) | 0;
  }
  return Math.abs(hash) % VOICE_GRADIENTS.length;
}

function authorInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

type ColumnistVoice = {
  name: string;
  slug: string;
  pieceCount: number;
  latestTitle: string;
  latestId: string;
  image?: string;
  excerpt: string;
};

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

function OpinionSidebar() {
  const popularNews = usePopularNewsArticles();

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <SidebarPanel title="Popular News">
          <PopularNewsSidebar articles={popularNews} variant="wide" />
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
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-12deg, transparent, transparent 11px, currentColor 11px, currentColor 12px)",
        }}
        aria-hidden
      />
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

function LeadEssay({ article }: { article: Article }) {
  return (
    <article className="group mb-12 overflow-hidden border border-border bg-card">
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Link
          href={`/article/${article.id}`}
          className="image-zoom relative block min-h-[240px] overflow-hidden bg-background lg:min-h-[360px]"
        >
          <ArticleCardImage
            article={article}
            fit="contain"
            className="h-full min-h-[240px] lg:min-h-[360px]"
            imgClassName="h-full w-full"
          />
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-foreground/80 via-foreground/30 to-transparent p-6 pt-16">
            <SectionLabel className="!text-primary-foreground/90 mb-2">
              Lead essay
            </SectionLabel>
          </div>
        </Link>
        <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10">
          <Quote
            className="mb-4 h-8 w-8 text-primary/25"
            strokeWidth={1.25}
            aria-hidden
          />
          <Link href={`/article/${article.id}`} className="block">
            <h2 className="font-serif text-2xl leading-[1.12] text-foreground transition-colors group-hover:text-primary md:text-[2rem] lg:text-[2.35rem]">
              {article.title}
            </h2>
          </Link>
          {article.excerpt ? (
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground line-clamp-4">
              {article.excerpt}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-5">
            <ArticleBylineMeta
              author={article.author}
              date={article.date}
              className="!mt-0 text-[11px] tracking-[0.12em]"
            />
            <span className="hidden sm:inline" aria-hidden>
              ·
            </span>
            <span>{article.readingTime}</span>
          </div>
          <Link
            href={`/article/${article.id}`}
            className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary transition-colors hover:underline"
          >
            Read the column
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function VoiceAvatar({ voice }: { voice: ColumnistVoice }) {
  const hasPhoto =
    Boolean(voice.image) &&
    !voice.image!.includes(".svg") &&
    !voice.image!.startsWith("/images/");

  return (
    <div
      className={cn(
        "relative mb-4 h-14 w-14 shrink-0 overflow-hidden rounded-full bg-linear-to-br",
        VOICE_GRADIENTS[voiceGradientIndex(voice.name)],
      )}
    >
      {hasPhoto ? (
        <img
          src={voice.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold tracking-wide text-white">
          {authorInitials(voice.name)}
        </span>
      )}
    </div>
  );
}

function VoicesStrip({ voices }: { voices: ColumnistVoice[] }) {
  if (voices.length === 0) return null;

  const pieceLabel = (count: number) =>
    `${count} ${count === 1 ? "piece" : "pieces"}`;

  return (
    <section className="mb-12">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            The voices
          </p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">Our columnists</h2>
        </div>
        <p className="hidden text-[11px] uppercase tracking-wider text-muted-foreground sm:block">
          Scroll →
        </p>
      </div>
      <div className="flex items-stretch gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
        {voices.map((voice) => (
          <Link
            key={voice.name}
            href={authorProfilePath(voice.name)}
            className="group flex h-[248px] w-[212px] shrink-0 snap-start flex-col border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <VoiceAvatar voice={voice} />

            <p className="min-h-12 font-serif text-lg leading-6 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {voice.name}
            </p>

            <p className="mt-2 h-4 shrink-0 text-[10px] font-semibold uppercase leading-4 tracking-wider text-muted-foreground">
              {pieceLabel(voice.pieceCount)}
            </p>

            <div className="mt-auto border-t border-border pt-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.14em] text-muted-foreground">
                Latest
              </p>
              <p className="min-h-10 text-[12px] leading-5 text-muted-foreground line-clamp-2">
                {voice.latestTitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EssayStreamItem({
  article,
  index,
}: {
  article: Article;
  index: number;
}) {
  return (
    <article className="group grid grid-cols-1 gap-4 border-b border-border py-8 first:pt-0 last:border-b-0 md:grid-cols-[72px_200px_1fr] md:gap-6 lg:grid-cols-[88px_240px_1fr]">
      <div className="flex items-start gap-3 md:flex-col md:gap-1">
        <span className="font-serif text-4xl leading-none text-primary/20 tabular-nums md:text-5xl">
          {String(index + 1).padStart(2, "0")}
        </span>
        <time className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:max-w-[4.5rem] md:leading-snug">
          {formatArticleDate(article.date)}
        </time>
      </div>

      <Link
        href={`/article/${article.id}`}
        className="image-zoom block aspect-4/3 overflow-hidden rounded-sm border border-border bg-background md:aspect-[4/3]"
      >
        <ArticleListImage src={article.image} alt="" />
      </Link>

      <div className="flex min-w-0 flex-col justify-center">
        {!isGenericPublicationAuthor(article.author) ? (
          <Link
            href={authorProfilePath(article.author)}
            className="mb-3 inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-primary hover:underline w-fit"
          >
            {article.author}
          </Link>
        ) : (
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {article.author}
          </p>
        )}
        <Link href={`/article/${article.id}`} className="block">
          <h3 className="font-serif text-xl leading-snug text-foreground transition-colors group-hover:text-primary md:text-2xl md:leading-[1.2]">
            {article.title}
          </h3>
        </Link>
        {article.excerpt ? (
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground line-clamp-2 max-w-2xl">
            {article.excerpt}
          </p>
        ) : null}
        <Link
          href={`/article/${article.id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/70 transition-colors group-hover:text-primary"
        >
          Continue reading
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}

export default function Opinion() {
  const published = usePublishedArticles();
  const [page, setPage] = useState(1);
  const perPage = 10;

  const columnArticles = useMemo(
    () =>
      published.filter((a) => {
        const cat = a.category.toLowerCase();
        return cat === "column" || cat === "opinion";
      }),
    [published],
  );

  const voices = useMemo(() => buildColumnists(columnArticles), [columnArticles]);

  const leadArticle = columnArticles[0] ?? null;
  const streamPool = leadArticle ? columnArticles.slice(1) : columnArticles;

  const { items: streamArticles, totalPages } = useMemo(
    () => paginateArticles(streamPool, page, perPage),
    [streamPool, page],
  );

  const streamOffset = (page - 1) * perPage;

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <PageShell layout="wideSidebar" sidebar={<OpinionSidebar />}>
        <OpinionMasthead
          storyCount={columnArticles.length}
          voiceCount={voices.length}
        />

        {leadArticle ? <LeadEssay article={leadArticle} /> : null}

        <VoicesStrip voices={voices} />

        <section>
          <div className="mb-2 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                The record
              </p>
              <h2 className="mt-1 font-serif text-2xl text-foreground md:text-3xl">
                Analysis &amp; essays
              </h2>
            </div>
            {totalPages > 1 ? (
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Page {page} of {totalPages}
              </p>
            ) : null}
          </div>

          {streamArticles.length === 0 && !leadArticle ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="font-serif text-xl text-foreground">No opinion pieces yet</p>
              <p className="mt-2 text-sm">
                Import or publish stories with category Opinion or Column.
              </p>
            </div>
          ) : (
            <div>
              {streamArticles.map((article, i) => (
                <EssayStreamItem
                  key={article.id}
                  article={article}
                  index={streamOffset + i}
                />
              ))}
            </div>
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
