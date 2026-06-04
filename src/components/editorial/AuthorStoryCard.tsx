import Link from "next/link";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import type { Article } from "@/store/articles-context";

import { formatAuthorDisplayName } from "@/lib/author-profile";
import { formatArticleDate } from "@/lib/site-articles";

import { cn } from "@/lib/utils";



const IMAGE_GRADIENTS = [

  "from-[#1C0A10] via-[#7A1A2E] to-[#C41E3A]",

  "from-[#1a2e26] via-[#2d4a3e] to-[#3d6b5a]",

  "from-[#2d1814] via-[#5c3d38] to-[#8B5A52]",

  "from-[#151c28] via-[#2d3a52] to-[#4A6080]",

];



function StoryImage({

  article,

  toneIndex,

  className,

}: {

  article: Article;

  toneIndex: number;

  className?: string;

}) {

  const category = article.category || "News";

  const gradient = IMAGE_GRADIENTS[toneIndex % IMAGE_GRADIENTS.length];

  const imageLabel = String((toneIndex % 9) + 1).padStart(2, "0");



  return (

    <div className={cn("relative shrink-0 overflow-hidden bg-background border-b border-border", className)}>

      {article.image ? (
        <EditorialImage
          src={article.image}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 400px"
          fit="contain"
          className="transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (

        <div

          className={cn(

            "flex h-full w-full flex-col bg-linear-to-b p-5",

            gradient,

          )}

        >

          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">

            {category}

          </p>

          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-white/70">

            Image {imageLabel}

          </p>

        </div>

      )}

    </div>

  );

}



function StoryContent({

  article,

  titleClassName,

  excerptClassName,

}: {

  article: Article;

  titleClassName?: string;

  excerptClassName?: string;

}) {

  const category = article.category || "News";



  return (

    <div className="p-4 flex min-h-0 flex-1 flex-col">

      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">

        {category}

      </span>

      <h3

        className={cn(

          "mt-3 font-serif text-xl font-bold leading-snug text-foreground",

          titleClassName,

        )}

      >

        {article.title}

      </h3>

      {article.excerpt ? (

        <p

          className={cn(

            "mt-3 text-sm leading-relaxed text-muted-foreground",

            excerptClassName,

          )}

        >

          {article.excerpt}

        </p>

      ) : null}

    </div>

  );

}



function StoryFooter({ author, date }: { author?: string; date?: string }) {
  const authorLabel = author?.trim() ? formatAuthorDisplayName(author) : "";
  const dateLabel = date?.trim() ? formatArticleDate(date) : "";
  const footer = [authorLabel, dateLabel].filter(Boolean).join(" · ");

  if (!footer) return null;

  return (
    <div className="flex min-h-11 shrink-0 items-center border-t border-border px-4 py-2.5 pt-3">
      <span className="text-[10px] font-medium uppercase leading-none tracking-[0.12em] text-muted-foreground">
        {footer}
      </span>
    </div>
  );
}



/** Large horizontal featured card */

export function AuthorStoryFeatured({

  article,

  toneIndex = 0,

}: {

  article: Article;

  toneIndex?: number;

}) {

  return (

    <Link

      href={`/article/${article.id}`}
      prefetch={false}
      className="editorial-card group flex flex-col overflow-hidden p-0 lg:flex-row"

    >

      <StoryImage

        article={article}

        toneIndex={toneIndex}

        className="aspect-16/10 lg:aspect-auto lg:w-[58%] lg:min-h-[280px]"

      />

      <div className="flex min-w-0 flex-1 flex-col">

        <StoryContent

          article={article}

          titleClassName="lg:text-[1.65rem] lg:leading-[1.2] line-clamp-4 min-h-[6.5rem]"

          excerptClassName="lg:text-[15px] line-clamp-4 min-h-[5.5rem]"

        />

        <div className="mt-auto">

          <StoryFooter author={article.author} date={article.date} />

        </div>

      </div>

    </Link>

  );

}



/** Standard vertical story card — matches reference layout */

export function AuthorStoryCard({

  article,

  toneIndex = 0,

  className,

}: {

  article: Article;

  toneIndex?: number;

  className?: string;

}) {

  return (

    <Link

      href={`/article/${article.id}`}
      prefetch={false}
      className={cn(
        "editorial-card group flex h-full flex-col overflow-hidden p-0",

        className,

      )}

    >

      <StoryImage article={article} toneIndex={toneIndex} className="aspect-5/4 w-full" />

      <StoryContent

        article={article}

        titleClassName="line-clamp-3 min-h-[4.5rem]"

        excerptClassName="line-clamp-2 min-h-[2.5rem]"

      />

      <StoryFooter author={article.author} date={article.date} />

    </Link>

  );

}


