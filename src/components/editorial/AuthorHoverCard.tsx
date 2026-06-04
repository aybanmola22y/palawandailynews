"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useArticles } from "@/store/articles-context";
import { useUsers } from "@/store/users-context";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  authorInitials,
  authorProfilePath,
  findUserByAuthorName,
  formatAuthorDisplayName,
  getArticlesByAuthor,
  isGenericPublicationAuthor,
} from "@/lib/author-profile";
import { getAuthorRawCandidates } from "@/lib/author-resolve";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ARTICLE_SUMMARY_SELECT } from "@/lib/articles/fetch-published-summaries";
import { rowToArticle } from "@/lib/articles/map-article-row";
import type { Article } from "@/store/articles-context";
import { formatArticleDate } from "@/lib/site-articles";

const PREVIEW_LIMIT = 5;

type AuthorHoverCardProps = {
  name: string;
  className?: string;
  /** When true, includes drafts in article list (admin). */
  includeDrafts?: boolean;
  /** Disable hover preview; link to profile only (e.g. inside another link). */
  linkOnly?: boolean;
  stopPropagation?: boolean;
};

export function AuthorLink({
  name,
  className,
  onClick,
}: {
  name: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  if (!name?.trim()) {
    return <span className={className}>—</span>;
  }

  const displayName = formatAuthorDisplayName(name);
  const href = `${authorProfilePath(name)}?name=${encodeURIComponent(displayName)}`;

  return (
    <Link
      href={href}
      className={cn(
        "inline hover:text-primary transition-colors",
        className,
      )}
      onClick={onClick}
    >
      {displayName}
    </Link>
  );
}

export function AuthorHoverCard({
  name,
  className,
  includeDrafts = false,
  linkOnly = false,
  stopPropagation = false,
}: AuthorHoverCardProps) {
  const router = useRouter();
  const { articles } = useArticles();
  const { users } = useUsers();

  const displayName = formatAuthorDisplayName(name);
  const profileHref = `${authorProfilePath(name)}?name=${encodeURIComponent(displayName)}`;

  const user = useMemo(
    () => findUserByAuthorName(users, name),
    [users, name],
  );

  const authorArticles = useMemo(
    () =>
      getArticlesByAuthor(articles, name, {
        publishedOnly: !includeDrafts,
      }),
    [articles, name, includeDrafts],
  );

  const [hoverOpen, setHoverOpen] = useState(false);
  const [remotePreview, setRemotePreview] = useState<null | Article[]>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteKey, setRemoteKey] = useState<string>("");
  const [remoteTotalCount, setRemoteTotalCount] = useState<number | null>(null);
  const remotePreviewRef = useRef<null | Article[]>(null);
  const remoteKeyRef = useRef<string>("");
  const remoteLoadingRef = useRef<boolean>(false);
  const remoteTotalCountRef = useRef<number | null>(null);

  if (!name?.trim()) {
    return <span className={className}>—</span>;
  }

  if (isGenericPublicationAuthor(name)) {
    return <span className={className}>{displayName}</span>;
  }

  if (linkOnly) {
    return (
      <AuthorLink
        name={name}
        className={className}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
        }}
      />
    );
  }

  const previewLocal = authorArticles.slice(0, PREVIEW_LIMIT);
  const effectivePreview = previewLocal.length > 0 ? previewLocal : (remotePreview ?? []);
  const totalStories = authorArticles.length > 0
    ? authorArticles.length
    : (remoteTotalCount ?? (remotePreview?.length ?? 0));
  const hasArticles = effectivePreview.length > 0;
  const initials = user?.avatar ?? authorInitials(name);

  useEffect(() => {
    if (linkOnly) return;
    if (!hoverOpen) return;
    if (remoteLoadingRef.current) return;

    const key = `${name}|drafts=${includeDrafts}`;
    if (remoteKeyRef.current === key && remotePreviewRef.current) return;

    const client = getSupabaseBrowserClient();
    if (!client) return;

    remoteLoadingRef.current = true;
    setRemoteLoading(true);
    setRemotePreview(null);
    remotePreviewRef.current = null;
    setRemoteTotalCount(null);
    remoteTotalCountRef.current = null;

    void (async () => {
      try {
        const rawCandidates = getAuthorRawCandidates(name);
        if (rawCandidates.length === 0) return;

        let q = client
          .from("articles")
          .select(ARTICLE_SUMMARY_SELECT, { count: "exact" })
          .in("author", rawCandidates)
          .order("date", { ascending: false })
          .limit(PREVIEW_LIMIT);

        if (!includeDrafts) {
          q = q.eq("status", "Published");
        }

        const { data, error, count } = await q;
        if (error) return;

        const preview = (data ?? []).map((row) => rowToArticle(row as never));
        remotePreviewRef.current = preview;
        setRemotePreview(preview);
        remoteKeyRef.current = key;
        setRemoteKey(key);
        const finalCount = count ?? preview.length;
        remoteTotalCountRef.current = finalCount;
        setRemoteTotalCount(finalCount);
      } finally {
        remoteLoadingRef.current = false;
        setRemoteLoading(false);
      }
    })();
  }, [
    linkOnly,
    hoverOpen,
    includeDrafts,
    name,
  ]);

  return (
    <HoverCard openDelay={250} closeDelay={120} onOpenChange={setHoverOpen}>
      <HoverCardTrigger asChild>
        <Link
          href={profileHref}
          className={cn(
            "inline hover:text-primary transition-colors",
            className,
          )}
          onClick={(e) => {
            if (stopPropagation) e.stopPropagation();
          }}
          onPointerDown={(e) => {
            if (stopPropagation) e.stopPropagation();
          }}
        >
          {displayName}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="bottom"
        className="w-[min(22rem,92vw)] rounded-sm border-border p-0 shadow-lg"
      >
        <div className="px-4 py-4 border-b border-border bg-[#FAFAF8] dark:bg-[#111111]">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-[12px] font-bold text-primary-foreground shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-serif text-lg font-semibold text-foreground leading-tight">
                {displayName}
              </div>
              {user ? (
                <>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-primary mt-1">
                    {user.role}
                  </div>
                  <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                    {user.email}
                  </div>
                </>
              ) : (
                <div className="text-[12px] text-muted-foreground mt-1">
                  Contributor
                </div>
              )}
              <div className="text-[11px] text-muted-foreground mt-2">
                {remoteLoading
                  ? "Loading…"
                  : hasArticles
                    ? `${totalStories} ${
                        includeDrafts ? "article" : "published story"
                      }${totalStories !== 1 ? "s" : ""}`
                    : "No published articles yet"}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 max-h-[240px] overflow-y-auto" data-lenis-prevent>
          {effectivePreview.length === 0 ? (
            <div className="text-[13px] text-muted-foreground py-2">
              No published articles yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {effectivePreview.map((article) => (
                <li key={article.id}>
                  <button
                    type="button"
                    className="block w-full text-left py-2.5 hover:text-primary transition-colors group"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/article/${article.id}`);
                    }}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                      {article.category}
                      {includeDrafts ? (
                        <span className="ml-2 text-foreground/60">
                          · {article.status || "Draft"}
                        </span>
                      ) : null}
                    </div>
                    <div className="font-serif text-[14px] leading-snug line-clamp-2">
                      {article.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                      {formatArticleDate(article.date)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href={profileHref}
          className="block px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-center text-primary border-t border-border bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          View full profile
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
}
