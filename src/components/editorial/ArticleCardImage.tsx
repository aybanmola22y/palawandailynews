import type { Article } from "@/store/articles-context";
import { cn } from "@/lib/utils";

/** Seed SVG paths — replaced with one consistent placeholder treatment */
function isSeedPlaceholder(src: string) {
  return src.startsWith("/images/") && src.endsWith(".svg");
}

type ArticleCardImageProps = {
  article: Article;
  /** 0-based index for "Image 01" label variation */
  index?: number;
  fit?: "cover" | "contain";
  className?: string;
  imgClassName?: string;
};

export function ArticleCardImage({
  article,
  index = 0,
  fit = "contain",
  className,
  imgClassName,
}: ArticleCardImageProps) {
  const usePlaceholder =
    !article.image || isSeedPlaceholder(article.image);
  const imageLabel = String((index % 9) + 1).padStart(2, "0");

  if (!usePlaceholder) {
    return (
      <div className={cn("relative overflow-hidden bg-background", className)}>
        <img
          src={article.image}
          alt=""
          className={cn(
            "h-full w-full transition-transform duration-500 group-hover:scale-[1.03]",
            fit === "contain" ? "object-contain" : "object-cover",
            imgClassName,
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-linear-to-br from-[#111111] via-[#5c1828] to-[#C41E3A]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-3 border border-white/10 sm:inset-4"
        aria-hidden
      />
      <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/90 sm:text-[10px]">
          Palawan Daily News
        </p>
        <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.2em] text-white/55 sm:text-[9px]">
          Image {imageLabel}
        </p>
      </div>
    </div>
  );
}
