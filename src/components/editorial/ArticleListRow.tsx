import Link from "next/link";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { ArticleListImage } from "@/components/editorial/ArticleListImage";
import {
  authorProfilePath,
  formatAuthorDisplayName,
  isGenericPublicationAuthor,
} from "@/lib/author-profile";
import { formatArticleDate } from "@/lib/site-articles";
import { cn } from "@/lib/utils";
import type { Article } from "@/store/articles-context";

type ArticleListRowProps = {
  article: Article;
  className?: string;
  titleClassName?: string;
};

function ListRowByline({
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
        "m-0 text-[11px] font-medium uppercase leading-snug tracking-wider text-muted-foreground",
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

/** Horizontal list row — thumbnail left, story right (Latest News page style). */
export function ArticleListRow({
  article,
  className,
  titleClassName,
}: ArticleListRowProps) {
  const hasExcerpt = Boolean(article.excerpt?.trim());

  const showByline = Boolean(article.author?.trim() || article.date);

  return (
    <article
      className={cn(
        "group grid grid-cols-1 gap-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[240px_minmax(0,1fr)]",
        className,
      )}
    >
      <Link
        href={`/article/${article.id}`}
        className="image-zoom flex aspect-4/3 w-full items-center justify-center self-start overflow-hidden rounded-sm border border-border bg-background md:aspect-3/2 md:w-full"
      >
        <ArticleListImage src={article.image} alt={article.title} />
      </Link>

      <div
        className={cn(
          "flex min-w-0 flex-col gap-4",
          showByline &&
            "md:grid md:h-full md:min-h-full md:grid-rows-[1fr_auto] md:gap-5",
        )}
      >
        <div className="min-w-0 md:min-h-0">
          <SectionLabel className="mb-2">{article.category}</SectionLabel>

          <Link href={`/article/${article.id}`} className="block w-full">
            <h2
              className={cn(
                "w-full font-serif text-2xl leading-snug line-clamp-2 text-pretty transition-colors group-hover:text-primary lg:text-[1.6rem]",
                titleClassName,
              )}
            >
              {article.title}
            </h2>
          </Link>

          {hasExcerpt ? (
            <p className="m-0 mt-3 line-clamp-2 overflow-hidden text-[15px] leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          ) : null}
        </div>

        {showByline ? (
          <ListRowByline
            author={article.author}
            date={article.date}
            className="shrink-0"
          />
        ) : null}
      </div>
    </article>
  );
}
