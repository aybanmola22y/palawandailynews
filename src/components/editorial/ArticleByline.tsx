"use client";

import { AuthorHoverCard } from "@/components/editorial/AuthorHoverCard";
import { formatAuthorDisplayName } from "@/lib/author-profile";
import { formatArticleDate } from "@/lib/site-articles";
import { cn } from "@/lib/utils";

export type ArticleBylineProps = {
  author?: string;
  date?: string;
  className?: string;
  authorClassName?: string;
  /** When false, only show the author (e.g. list rows where date appears elsewhere). */
  showDate?: boolean;
  linkOnly?: boolean;
};

/** Space below headlines before author + date (site-wide). */
export const articleBylineMetaClassName =
  "mt-3 block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";

/** Card footer row under a border (author strip on grid cards). */
export const articleCardBylineFooterClassName =
  "mt-auto shrink-0 border-t border-border pt-3";

/** Card/list byline — shows resolved author + optional date. */
export function ArticleByline({
  author,
  date,
  className,
  authorClassName,
  showDate = true,
  linkOnly,
}: ArticleBylineProps) {
  const rawAuthor = author?.trim() ?? "";
  const displayAuthor = rawAuthor ? formatAuthorDisplayName(rawAuthor) : null;
  const dateLabel = showDate && date ? formatArticleDate(date) : null;

  if (!displayAuthor && !dateLabel) return null;

  return (
    <span className={className}>
      {displayAuthor ? (
        <AuthorHoverCard
          name={rawAuthor || displayAuthor}
          className={cn("font-medium", authorClassName)}
          linkOnly={linkOnly}
        />
      ) : null}
      {displayAuthor && dateLabel ? " · " : null}
      {dateLabel}
    </span>
  );
}

/** Byline with standard gap below the article title. */
export function ArticleBylineMeta({
  className,
  authorClassName,
  ...props
}: ArticleBylineProps) {
  return (
    <ArticleByline
      {...props}
      className={cn(articleBylineMetaClassName, className)}
      authorClassName={cn("text-muted-foreground", authorClassName)}
    />
  );
}

/** Bordered footer on editorial cards (latest grid, opinion, related stories, etc.). */
export function ArticleCardBylineFooter({
  authorClassName,
  innerClassName,
  ...props
}: ArticleBylineProps & { innerClassName?: string }) {
  return (
    <div className={articleCardBylineFooterClassName}>
      <div
        className={cn(
          "flex min-h-11 items-center px-4 py-2.5 sm:px-5 md:px-6",
          innerClassName,
        )}
      >
        <ArticleBylineMeta className="!mt-0" authorClassName={authorClassName} {...props} />
      </div>
    </div>
  );
}
