"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Facebook, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import { useArticles } from "@/store/articles-context";
import { useReadingProgress } from "@/hooks/use-reading-progress";
import {
  renderContent,
  extractHeadings,
  prepareArticleBody,
  resolveDisplayExcerpt,
} from "@/lib/render-content";
import { ArticleInlineAd } from "@/components/ads/ArticleInlineAd";
import { ArticleCardImage } from "@/components/editorial/ArticleCardImage";
import { ArticleListImage } from "@/components/editorial/ArticleListImage";
import {
  ArticleBylineMeta,
  ArticleCardBylineFooter,
} from "@/components/editorial/ArticleByline";
import { PopularNewsSidebar } from "@/components/editorial/PopularNewsSidebar";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { DividerLabel } from "@/components/editorial/DividerLabel";
import { ArticleDetailHeader } from "@/components/editorial/ArticleDetailHeader";
import { PageShell } from "@/components/editorial/PageShell";
import { SidebarPanel } from "@/components/editorial/SidebarPanel";
import { usePopularNewsArticles } from "@/hooks/use-popular-news-articles";
import { formatArticleDate, getPublishedArticles } from "@/lib/site-articles";

function resolveArticleId(param: string) {
  return param.startsWith("wp-") ? param.slice(3) : param;
}

type SidebarArticle = {
  id: string;
  title: string;
  date: string;
  category?: string;
  author?: string;
  image?: string;
};

function ArticleSidebarItem({
  article,
  rank,
}: {
  article: SidebarArticle;
  rank?: number;
}) {
  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-5">
        <Link
          href={`/article/${article.id}`}
          className="group image-zoom flex w-[100px] shrink-0 aspect-4/3 items-center justify-center overflow-hidden rounded-sm border border-border bg-background"
        >
          <ArticleListImage
            src={article.image}
            className="transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </Link>
        <div className="flex flex-1 flex-col gap-3.5 pt-0.5">
          {rank != null ? (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              #{String(rank).padStart(2, "0")}
            </p>
          ) : null}
          {article.category ? (
            <SectionLabel className="leading-snug">{article.category}</SectionLabel>
          ) : null}
          <Link href={`/article/${article.id}`} className="group block">
            <p className="font-serif text-[16px] leading-[1.45] text-foreground line-clamp-3 group-hover:text-primary transition-colors">
              {article.title}
            </p>
          </Link>
          <ArticleBylineMeta
            author={article.author}
            date={article.date}
            className="!mt-0 whitespace-nowrap tracking-[0.08em]"
          />
        </div>
      </div>
    </div>
  );
}

function ArticleSidebar({
  latest,
  popular,
}: {
  latest: SidebarArticle[];
  popular: SidebarArticle[];
}) {
  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <SidebarPanel title="Latest News" variant="prominent">
          <div className="flex flex-col divide-y divide-border">
            {latest.map((a) => (
              <ArticleSidebarItem key={a.id} article={a} />
            ))}
          </div>
        </SidebarPanel>
      </section>

      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <SidebarPanel title="Popular News" variant="prominent">
          <PopularNewsSidebar articles={popular} />
        </SidebarPanel>
      </section>
    </div>
  );
}

export default function ArticleDetail() {
  const { articles, ensureArticleContent } = useArticles();
  const params = useParams<{ id: string }>();
  const rawId = params?.id ?? "";
  const lookupId = resolveArticleId(rawId);
  const popularNews = usePopularNewsArticles();

  const article = useMemo(() => {
    if (!lookupId) return undefined;
    if (rawId.startsWith("wp-")) {
      const wpId = Number(lookupId);
      if (Number.isFinite(wpId)) {
        return articles.find((a) => a.legacyWpId === wpId);
      }
    }
    return articles.find((a) => a.id === lookupId || a.id === rawId);
  }, [articles, lookupId, rawId]);

  const progress = useReadingProgress();

  useEffect(() => {
    if (!article?.id) return;
    if (!article.content?.trim()) {
      void ensureArticleContent(article.id);
    }
  }, [article?.id, article?.content, ensureArticleContent]);

  const latestSidebar = useMemo(() => {
    const published = getPublishedArticles(articles);
    return published
      .filter((a) => a.id !== (article?.id ?? ""))
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        title: a.title,
        date: a.date,
        category: a.category,
        author: a.author,
        image: a.image,
      }));
  }, [articles, article?.id]);

  const popularSidebar = useMemo(
    () =>
      popularNews
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          title: a.title,
          date: a.date,
          image: a.image,
          category: a.category,
          author: a.author,
        })),
    [popularNews],
  );

  const related = useMemo(() => {
    if (!article) return [];
    return articles
      .filter((a) => a.id !== article.id && a.status === "Published")
      .slice(0, 3);
  }, [articles, article]);

  const articleBody = useMemo(() => {
    if (!article) return "";
    return prepareArticleBody(article.content || "", article.excerpt);
  }, [article]);

  const headings = useMemo(() => extractHeadings(articleBody), [articleBody]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background editorial-container py-24 text-center">
        <h1 className="font-serif text-3xl mb-3">Article unavailable</h1>
        <p className="text-muted-foreground text-sm mb-6">
          This story is not in the imported archive yet.
        </p>
        <Link
          href="/latest"
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary hover:underline"
        >
          Browse latest news
        </Link>
      </div>
    );
  }

  const isPublished = article.status === "Published";

  return (
    <article className="min-h-screen bg-background">
      <div
        className="fixed top-0 left-0 h-0.5 bg-primary z-50 transition-all duration-150"
        style={{ width: `${progress}%` }}
        aria-hidden
      />

      <div className="py-8 md:py-12">
        <PageShell
          layout="article"
          sidebar={<ArticleSidebar latest={latestSidebar} popular={popularSidebar} />}
        >
          <div className="max-w-4xl">
            <ArticleDetailHeader
              category={article.category}
              title={article.title}
              excerpt={resolveDisplayExcerpt(article.excerpt, article.content)}
              author={article.author}
              date={formatArticleDate(article.date)}
              readingTime={article.readingTime}
              image={article.image}
              statusLabel={!isPublished ? article.status : undefined}
            />

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {renderContent(articleBody)}
            </div>

            <ArticleInlineAd />

            {headings.length > 0 && (
              <aside className="mt-12 p-6 border border-border rounded-sm bg-card">
                <h2 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-4">
                  In this article
                </h2>
                <ul className="space-y-2 text-sm">
                  {headings.map((heading) => (
                    <li key={heading}>{heading}</li>
                  ))}
                </ul>
              </aside>
            )}

            <div className="mt-12 pt-8 border-t border-border flex gap-4">
              <button
                type="button"
                className="p-2 border border-border rounded-sm hover:border-primary transition-colors"
                aria-label="Share on Facebook"
              >
                <Facebook className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-2 border border-border rounded-sm hover:border-primary transition-colors"
                aria-label="Share on Twitter"
              >
                <Twitter className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-2 border border-border rounded-sm hover:border-primary transition-colors"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-2 border border-border rounded-sm hover:border-primary transition-colors"
                aria-label="Copy link"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {related.length > 0 && (
            <section className="border-t border-border bg-secondary/30 py-14 mt-14">
              <DividerLabel label="Related stories" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {related.map((rel) => (
                  <article
                    key={rel.id}
                    className="editorial-card group flex h-full flex-col overflow-hidden p-0 hover:border-primary/40 transition-colors"
                  >
                    <Link
                      href={`/article/${rel.id}`}
                      className="flex min-h-0 flex-1 flex-col"
                    >
                      <div className="shrink-0 border-b border-border bg-background">
                        <ArticleCardImage
                          article={rel}
                          fit="contain"
                          className="aspect-4/3 w-full"
                          imgClassName="h-full w-full"
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <SectionLabel className="mb-2">{rel.category}</SectionLabel>
                        <h3 className="mb-3 font-serif text-lg leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                          {rel.title}
                        </h3>
                        <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                          {rel.excerpt}
                        </p>
                      </div>
                    </Link>
                    <ArticleCardBylineFooter
                      author={rel.author}
                      date={rel.date}
                    />
                  </article>
                ))}
              </div>
            </section>
          )}
        </PageShell>
      </div>
    </article>
  );
}
