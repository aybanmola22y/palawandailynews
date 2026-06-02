"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { ArticleListImage } from "@/components/editorial/ArticleListImage";
import {
  authorProfilePath,
  formatAuthorDisplayName,
} from "@/lib/author-profile";
import { cn } from "@/lib/utils";

export type ColumnistVoice = {
  name: string;
  slug: string;
  pieceCount: number;
  latestTitle: string;
  latestId: string;
  image?: string;
  excerpt: string;
};

type ColumnistsVoicesStripProps = {
  voices: ColumnistVoice[];
  /** How many cards before “Show all”. Default 6. */
  previewLimit?: number;
  /** `sidebar` = opinion page right rail (2–3 col cards). `grid` = full-width section. */
  variant?: "grid" | "sidebar";
};

function authorInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function hasPortrait(image?: string) {
  return Boolean(
    image && !image.includes(".svg") && !image.startsWith("/images/"),
  );
}

function ColumnistCompactCard({
  voice,
  dense = false,
}: {
  voice: ColumnistVoice;
  dense?: boolean;
}) {
  const displayName = formatAuthorDisplayName(voice.name);
  const portrait = hasPortrait(voice.image);
  const profileHref = authorProfilePath(voice.name);
  const latestHref = voice.latestId ? `/article/${voice.latestId}` : profileHref;

  return (
    <article
      className={cn(
        "editorial-card group flex h-full min-w-0 w-full flex-col overflow-hidden rounded-sm",
        "hover:border-primary/35",
      )}
    >
      <Link
        href={profileHref}
        className={cn(
          "image-zoom relative block shrink-0 overflow-hidden border-b border-border bg-background",
          dense ? "aspect-video" : "aspect-16/10",
        )}
      >
        {portrait ? (
          <ArticleListImage src={voice.image} alt="" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#F3F1EE] dark:bg-[#1c1b19]">
            <span
              className={cn(
                "font-serif text-[#5E4FA8] dark:text-[#b2a6dd]",
                dense ? "text-[26px]" : "text-[34px]",
              )}
            >
              {authorInitials(displayName)}
            </span>
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-foreground/65 via-foreground/20 to-transparent"
          aria-hidden
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground backdrop-blur-sm">
            {voice.pieceCount} {voice.pieceCount === 1 ? "column" : "columns"}
          </span>
        </div>
      </Link>

      <div className={cn("flex flex-1 flex-col", dense ? "p-3.5" : "p-5")}>
        <Link href={profileHref} className="block">
          <h3
            className={cn(
              "font-serif leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-2",
              dense ? "text-[15px]" : "text-[19px]",
            )}
          >
            {displayName}
          </h3>
        </Link>

        {voice.latestTitle ? (
          <div className={cn(dense ? "mt-2" : "mt-3")}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Latest
            </p>
            <Link
              href={latestHref}
              className={cn(
                "mt-1 block leading-snug text-foreground/80 line-clamp-2 transition-colors hover:text-primary",
                dense ? "text-[12px]" : "text-[13px]",
              )}
            >
              {voice.latestTitle}
            </Link>
          </div>
        ) : null}

        {!dense && voice.excerpt ? (
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
            {voice.excerpt}
          </p>
        ) : null}

        <Link
          href={profileHref}
          className={cn(
            "mt-auto inline-flex items-center gap-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em]",
            "text-foreground/60 transition-colors group-hover:text-primary",
          )}
        >
          Profile
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}

function ColumnistsHeader({
  id,
  count,
  compact = false,
}: {
  id: string;
  count: number;
  compact?: boolean;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        compact ? "mb-5" : "mb-6",
      )}
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-primary" aria-hidden />
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-primary">
            The voices
          </p>
        </div>
        <h2
          id={id}
          className={cn(
            "mt-2 font-serif leading-tight text-foreground",
            compact ? "text-xl sm:text-[1.65rem]" : "text-2xl sm:text-[1.85rem]",
          )}
        >
          Our Columnists
        </h2>
      </div>
      <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {count} {count === 1 ? "contributor" : "contributors"}
      </p>
    </header>
  );
}

export function ColumnistsVoicesStrip({
  voices,
  previewLimit = 6,
  variant = "grid",
}: ColumnistsVoicesStripProps) {
  const [showAll, setShowAll] = useState(false);

  if (voices.length === 0) return null;

  const isSidebar = variant === "sidebar";
  const hasMore = voices.length > previewLimit;
  const visible = showAll || !hasMore ? voices : voices.slice(0, previewLimit);
  const hiddenCount = voices.length - previewLimit;
  const headingId = isSidebar ? "columnists-heading-sidebar" : "columnists-heading-grid";

  const gridClass = isSidebar
    ? "grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:gap-5"
    : "grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      className={cn("w-full min-w-0", !isSidebar && "mt-16 border-t border-border pt-12")}
      aria-labelledby={headingId}
    >
      <ColumnistsHeader id={headingId} count={voices.length} compact={isSidebar} />

      <div
        className={cn(
          gridClass,
          showAll &&
            hasMore &&
            isSidebar &&
            "voices-strip-scroll max-h-[min(42rem,70vh)] overflow-y-auto pr-0.5",
        )}
      >
        {visible.map((voice) => (
          <ColumnistCompactCard key={voice.name} voice={voice} dense={isSidebar} />
        ))}
      </div>

      {hasMore ? (
        <div className={cn("flex justify-center", isSidebar ? "mt-5" : "mt-6")}>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className={cn(
              "inline-flex items-center justify-center gap-2 border border-border bg-background text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:border-primary hover:text-primary",
              isSidebar ? "w-full px-4 py-2.5" : "rounded-sm px-5 py-2.5",
            )}
            aria-expanded={showAll}
          >
            {showAll
              ? "Show fewer columnists"
              : `Show all columnists (${hiddenCount} more)`}
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", showAll && "rotate-180")}
            />
          </button>
        </div>
      ) : null}
    </section>
  );
}
