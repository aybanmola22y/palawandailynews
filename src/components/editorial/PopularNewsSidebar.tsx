import Link from "next/link";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { ArticleBylineMeta } from "@/components/editorial/ArticleByline";
import type { Article } from "@/store/articles-context";
import { cn } from "@/lib/utils";

export type PopularNewsArticle = Pick<Article, "id" | "title" | "date"> & {
  category?: string;
  author?: string;
  image?: string;
};

function isUsableSidebarImage(src?: string) {
  if (!src?.trim()) return false;
  if (src.includes(".svg")) return false;
  if (src.startsWith("/images/")) return false;
  return true;
}

type PopularNewsSidebarProps = {
  articles: PopularNewsArticle[];
  className?: string;
  /** Wider thumbnails (homepage hero column). Default: compact sidebar. */
  variant?: "compact" | "wide";
};

/** Thumbnail + headline strip — matches homepage Popular News. */
export function PopularNewsSidebar({
  articles,
  className,
  variant = "compact",
}: PopularNewsSidebarProps) {
  const wide = variant === "wide";

  return (
    <div className={cn("flex flex-col divide-y divide-border", className)}>
      {articles.map((article) => (
        <article key={article.id} className="py-5 first:pt-0 last:pb-0">
          <div className={cn("flex gap-4", wide ? "sm:gap-5" : "items-start sm:gap-5")}>
            <Link
              href={`/article/${article.id}`}
              className={cn(
                "group image-zoom block shrink-0 overflow-hidden rounded-sm bg-background",
                wide
                  ? "w-[38%] max-w-[200px] min-w-[120px] aspect-4/3"
                  : "flex aspect-4/3 w-[108px] items-center justify-center border border-border sm:w-[120px]",
              )}
            >
              {isUsableSidebarImage(article.image) ? (
                <img
                  src={article.image}
                  alt=""
                  className="h-full w-full bg-background object-contain"
                />
              ) : (
                <div
                  className="h-full w-full bg-linear-to-br from-[#111111] via-[#5c1828] to-[#C41E3A]"
                  aria-hidden
                />
              )}
            </Link>
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col py-0.5",
                wide ? "justify-center" : "justify-center",
              )}
            >
              <Link href={`/article/${article.id}`} className="group block">
                {article.category ? (
                  <SectionLabel className="mb-1">{article.category}</SectionLabel>
                ) : null}
                <h2
                  className={cn(
                    "font-serif leading-snug text-foreground line-clamp-3 transition-colors group-hover:text-primary",
                    wide ? "text-lg" : "text-[17px] sm:text-lg",
                  )}
                >
                  {article.title}
                </h2>
              </Link>
              <ArticleBylineMeta author={article.author} date={article.date} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
