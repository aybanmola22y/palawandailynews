"use client";

import { useState } from "react";
import { resolveImageUrl } from "@/lib/articles/map-article-row";
import { cn } from "@/lib/utils";

const PLACEHOLDER_CLASS =
  "h-full w-full bg-linear-to-br from-[#111111] via-[#5c1828] to-[#C41E3A]";

function isSeedPlaceholder(src: string) {
  return src.startsWith("/images/") && src.endsWith(".svg");
}

export type EditorialImageProps = {
  src?: string;
  alt?: string;
  className?: string;
  /** Parent must be `position: relative` with defined size when using fill. */
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  fit?: "contain" | "cover";
};

/**
 * Native img for article media — avoids Next image optimizer breaking Hostinger/CDN URLs.
 * URLs are normalized via resolveImageUrl (relative paths → palawandailynews.com).
 */
export function EditorialImage({
  src,
  alt = "",
  className,
  priority = false,
  fit = "contain",
}: EditorialImageProps) {
  const [broken, setBroken] = useState(false);
  const url = src ? resolveImageUrl(src) : "";

  if (!url || isSeedPlaceholder(url) || broken) {
    return <div className={cn(PLACEHOLDER_CLASS, className)} aria-hidden />;
  }

  const objectClass = fit === "cover" ? "object-cover" : "object-contain";

  return (
    <img
      src={url}
      alt={alt}
      className={cn("h-full w-full bg-background", objectClass, className)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setBroken(true)}
    />
  );
}
