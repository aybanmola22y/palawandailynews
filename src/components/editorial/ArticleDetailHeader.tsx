import type { ReactNode } from "react";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import { AuthorHoverCard } from "@/components/editorial/AuthorHoverCard";
import { SectionLabel } from "@/components/editorial/SectionLabel";
import { cn } from "@/lib/utils";

export type ArticleDetailHeaderProps = {
  category?: string;
  title: string;
  excerpt?: string;
  author?: string;
  date?: string;
  readingTime?: string;
  image?: string;
  imageAlt?: string;
  /** Shown in the byline when the story is not published (e.g. Draft). */
  statusLabel?: string;
  className?: string;
};

export function ArticleDetailHeader({
  category,
  title,
  excerpt,
  author,
  date,
  readingTime,
  image,
  imageAlt = "",
  statusLabel,
  className,
}: ArticleDetailHeaderProps) {
  const bylineItems: ReactNode[] = [];
  if (author) bylineItems.push(<AuthorHoverCard key="author" name={author} className="font-medium" />);
  if (date) bylineItems.push(<time key="date">{date}</time>);
  if (readingTime) bylineItems.push(<span key="read">{readingTime}</span>);
  if (statusLabel) {
    bylineItems.push(
      <span key="status" className="text-primary">
        {statusLabel}
      </span>,
    );
  }

  return (
    <header className={cn("max-w-4xl", className)}>
      {category ? <SectionLabel>{category}</SectionLabel> : null}

      <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-[1.08] mt-3 mb-4">
        {title}
      </h1>

      {bylineItems.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium border-b border-border pb-6 mb-8">
          {bylineItems.map((item, index) => (
            <span key={index} className="contents">
              {index > 0 ? <span aria-hidden>·</span> : null}
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="border-b border-border pb-6 mb-8" aria-hidden />
      )}

      {image ? (
        <div className="relative mb-8 aspect-3/2 max-h-[520px] w-full overflow-hidden rounded-sm bg-background">
          <EditorialImage
            src={image}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 896px"
            fit="contain"
          />
        </div>
      ) : null}

      {excerpt ? (
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
          {excerpt}
        </p>
      ) : null}
    </header>
  );
}
