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

  return (
    <article
      className={cn(
        "group flex flex-col gap-6 md:flex-row md:items-start md:gap-8",
        className,
      )}
    >
      <Link
        href={`/article/${article.id}`}
        className="image-zoom flex aspect-4/3 w-full shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-background md:aspect-3/2 md:w-[200px] lg:w-[240px]"
      >
        <ArticleListImage src={article.image} alt={article.title} />
      </Link>

      <div className="flex w-full min-w-0 flex-1 flex-col">
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

        {(hasExcerpt || article.author || article.date) && (
          <div className="mt-3 w-full">
            {hasExcerpt ? (
              <p className="m-0 line-clamp-2 overflow-hidden text-[15px] leading-snug text-muted-foreground">
                {article.excerpt}
              </p>
            ) : null}
            <ListRowByline
              author={article.author}
              date={article.date}
              className={hasExcerpt ? "mt-3" : undefined}
            />
          </div>
        )}
      </div>
    </article>
  );
}
