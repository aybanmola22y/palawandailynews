import Link from "next/link";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { ArticleBylineMeta } from "@/components/editorial/ArticleByline";
import { ArticleListImage } from "@/components/editorial/ArticleListImage";
import { cn } from "@/lib/utils";
import type { Article } from "@/store/articles-context";

type ArticleListRowProps = {
  article: Article;
  className?: string;
  titleClassName?: string;
};

/** Horizontal list row — thumbnail left, story right (Latest News page style). */
export function ArticleListRow({
  article,
  className,
  titleClassName,
}: ArticleListRowProps) {
  return (
    <article
      className={cn(
        "scroll-perf-item group grid grid-cols-1 gap-6 border-border md:grid-cols-[220px_1fr] md:gap-8 lg:grid-cols-[280px_1fr]",
        className,
      )}
    >
      <Link
        href={`/article/${article.id}`}
        className="image-zoom flex aspect-4/3 items-center justify-center overflow-hidden rounded-sm border border-border bg-background md:aspect-3/2"
      >
        <ArticleListImage src={article.image} alt={article.title} />
      </Link>

      <div className="flex min-w-0 flex-col justify-center">
        <SectionLabel className="mb-2">{article.category}</SectionLabel>

        <Link href={`/article/${article.id}`} className="block">
          <h2
            className={cn(
              "font-serif text-2xl leading-tight transition-colors group-hover:text-primary lg:text-[1.65rem]",
              titleClassName,
            )}
          >
            {article.title}
          </h2>
        </Link>

        {article.excerpt ? (
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted-foreground line-clamp-2">
            {article.excerpt}
          </p>
        ) : null}

        <ArticleBylineMeta
          author={article.author}
          date={article.date}
          className="text-[11px] tracking-wider"
        />
      </div>
    </article>
  );
}
