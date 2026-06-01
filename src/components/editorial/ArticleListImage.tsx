import { cn } from "@/lib/utils";

const PLACEHOLDER_CLASS =
  "h-full w-full bg-linear-to-br from-[#111111] via-[#5c1828] to-[#C41E3A]";

type ArticleListImageProps = {
  src?: string;
  alt?: string;
  className?: string;
};

/** Shows the full image inside a frame without cropping (for list/search thumbnails). */
export function ArticleListImage({ src, alt = "", className }: ArticleListImageProps) {
  if (!src) {
    return <div className={cn(PLACEHOLDER_CLASS, className)} aria-hidden />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-full w-full object-contain bg-background", className)}
    />
  );
}
