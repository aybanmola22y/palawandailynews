"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ArticleListImage } from "@/components/editorial/ArticleListImage";
import { ArticleBylineMeta } from "@/components/editorial/ArticleByline";
import { ArticleListRow } from "@/components/editorial/ArticleListRow";
import { PopularNewsSidebar } from "@/components/editorial/PopularNewsSidebar";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { DividerLabel } from "@/components/editorial/DividerLabel";
import { ArticleDetailHeader } from "@/components/editorial/ArticleDetailHeader";
import { ArticleTags } from "@/components/editorial/ArticleTags";
import { PageShell } from "@/components/editorial/PageShell";
import { SidebarPanel } from "@/components/editorial/SidebarPanel";
import { usePopularNewsArticles } from "@/hooks/use-popular-news-articles";
import {
  formatArticleDate,
  getPublishedArticles,
  getRelatedArticles,
} from "@/lib/site-articles";

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
          prefetch={false}
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
          <Link href={`/article/${article.id}`} prefetch={false} className="group block">
            <p className="font-serif text-[16px] leading-[1.45] text-foreground line-clamp-3 group-hover:text-primary transition-colors">
              {article.title}
            </p>
          </Link>
          <ArticleBylineMeta
            author={article.author}
            date={article.date}
            className="mt-0! whitespace-nowrap tracking-[0.08em]"
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
  const [loadingBody, setLoadingBody] = useState(false);

  useEffect(() => {
    if (!article?.id) return;
    if (article.content?.trim()) {
      setLoadingBody(false);
      return;
    }
    let cancelled = false;
    setLoadingBody(true);
    void ensureArticleContent(article.id).finally(() => {
      if (!cancelled) setLoadingBody(false);
    });
    return () => {
      cancelled = true;
    };
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
    return getRelatedArticles(articles, article, 3);
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
              {loadingBody && !article.content?.trim() ? (
                <p className="text-muted-foreground">Loading story…</p>
              ) : (
                renderContent(articleBody)
              )}
            </div>

            <ArticleTags tags={article.tags} />

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
            <section className="mt-14 border-t border-border pt-10">
              <DividerLabel label="Related stories" />
              <div className="mt-8 divide-y divide-border">
                {related.map((rel) => (
                  <ArticleListRow
                    key={rel.id}
                    article={rel}
                    className="py-8 first:pt-6"
                  />
                ))}
              </div>
            </section>
          )}
        </PageShell>
      </div>
    </article>
  );
}
