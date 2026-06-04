import { EditorialImage } from "@/components/editorial/EditorialImage";
import { cn } from "@/lib/utils";

type ArticleListImageProps = {
  src?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
};

/** Shows the full image inside a frame without cropping (for list/search thumbnails). */
export function ArticleListImage({
  src,
  alt = "",
  className,
  priority = false,
}: ArticleListImageProps) {
  return (
    <div className={cn("relative h-full w-full", className)}>
      <EditorialImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 240px"
        fit="contain"
      />
    </div>
  );
}
