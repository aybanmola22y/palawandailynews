"use client";

import Link from "next/link";
import { useParams, useSearchParams, notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { useArticles } from "@/store/articles-context";
import { useUsers } from "@/store/users-context";
import { useStaff } from "@/store/staff-context";
import { ArticleListRow } from "@/components/editorial/ArticleListRow";
import {
  authorBio,
  findStaffByAuthorName,
  findUserByAuthorName,
  formatAuthorDisplayName,
  getArticlesByAuthor,
  resolveAuthorNameBySlug,
  resolveAuthorPublicProfile,
} from "@/lib/author-profile";
import { paginateArticles } from "@/lib/site-articles";
import { cn } from "@/lib/utils";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-8 bg-[#4F63E8]" aria-hidden />
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#4F63E8]">
        {children}
      </span>
    </div>
  );
}

export default function AuthorProfile() {
  const params = useParams<{ slug: string }>();
  const sp = useSearchParams();
  const slug = params?.slug ?? "";
  const { articles } = useArticles();
  const { users } = useUsers();
  const { staff } = useStaff();

  const nameFromQuery = (sp.get("name") ?? "").trim();

  const localResolvedName = useMemo(
    () => resolveAuthorNameBySlug(slug, users, staff, articles),
    [slug, users, staff, articles],
  );

  const [resolvedName, setResolvedName] = useState(
    nameFromQuery || localResolvedName || "",
  );

  useEffect(() => {
    setResolvedName(nameFromQuery || localResolvedName || "");
  }, [nameFromQuery, localResolvedName]);

  const authorName = resolvedName;
  const displayName = useMemo(
    () => (authorName ? formatAuthorDisplayName(authorName) : ""),
    [authorName],
  );

  const user = useMemo(
    () => (authorName ? findUserByAuthorName(users, authorName) : undefined),
    [users, authorName],
  );

  const staffProfile = useMemo(
    () => (authorName ? findStaffByAuthorName(staff, authorName) : undefined),
    [staff, authorName],
  );

  const authorArticles = useMemo(
    () =>
      authorName
        ? getArticlesByAuthor(articles, authorName, { publishedOnly: true })
        : [],
    [articles, authorName],
  );

  const publishedArticles = authorArticles;

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of publishedArticles) {
      if (a.category) set.add(a.category);
    }
    return Array.from(set);
  }, [publishedArticles]);

  const profile = useMemo(
    () =>
      displayName
        ? resolveAuthorPublicProfile(displayName, user, staffProfile, categories)
        : null,
    [displayName, user, staffProfile, categories],
  );

  if (!authorName || !displayName || !profile) {
    notFound();
  }

  const shortBio = authorBio(displayName, user?.role);
  const firstName = displayName.split(" ")[0];

  const [page, setPage] = useState(1);
  const perPage = 12;

  const { items: pageArticles, totalPages } = useMemo(
    () => paginateArticles(publishedArticles, page, perPage),
    [publishedArticles, page, perPage],
  );

  const canPrev = page > 1;
  const canNext = page < totalPages;

  useEffect(() => {
    setPage(1);
  }, [authorName]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-[#F7F6F4] dark:bg-background">
      <div className="site-gutter w-full py-10 sm:py-14 pb-20">
        {/* Profile hero */}
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(240px,300px)_1fr] gap-10 lg:gap-14 items-start mb-16 lg:mb-20">
          <div className="mx-auto w-full max-w-[300px] lg:max-w-none aspect-square rounded-sm bg-[#E8E4F0] dark:bg-[#2a2638] flex flex-col items-center justify-center shadow-[inset_0_0_0_1px_rgba(107,91,149,0.12)]">
            <span className="font-serif text-[5.5rem] sm:text-[6.5rem] leading-none font-normal text-[#4A3F6B] dark:text-[#c4b8e8] select-none">
              {profile.avatar}
            </span>
            <span className="mt-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#9B8FB5] dark:text-[#8a7da8]">
              {profile.badgeLabel}
            </span>
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-[#6B5B95]" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6B5B95]">
                Palawan Daily News
              </span>
            </div>

            <h1 className="font-serif text-[2.5rem] sm:text-[3rem] lg:text-[3.25rem] leading-[1.05] font-bold text-foreground tracking-tight">
              {displayName}
            </h1>

            <p className="mt-3 text-lg sm:text-xl font-medium text-[#6B5B95] dark:text-[#a898c8]">
              {profile.profileTitle}
            </p>

            <p className="mt-6 text-base sm:text-lg font-semibold italic leading-relaxed text-foreground/90 max-w-3xl">
              &ldquo;{profile.quote}&rdquo;
            </p>

            <p className="mt-5 text-[15px] sm:text-base leading-[1.7] text-muted-foreground max-w-3xl">
              {profile.bio}
            </p>

            {profile.email ? (
              <a
                href={`mailto:${profile.email}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#6B5B95] hover:text-[#4F63E8] transition-colors w-fit"
              >
                <Mail className="h-4 w-4" />
                {profile.email}
              </a>
            ) : null}
          </div>
        </section>

        {/* Stories section */}
        <header className="mb-8 lg:mb-10">
          <SectionLabel>Latest Work</SectionLabel>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Published Articles
          </h2>
          <p className="mt-3 text-[15px] sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            {publishedArticles.length > 0 ? (
              <>
                {publishedArticles.length} published{" "}
                {publishedArticles.length === 1 ? "story" : "stories"} from{" "}
                {firstName}
                {categories.length > 0
                  ? ` — ${categories.slice(0, 6).join(", ").toLowerCase()}`
                  : ""}
                {categories.length > 6 ? ", and more" : ""}.
              </>
            ) : (
              <>
                Recent work from {firstName} will appear here when stories are
                published.
              </>
            )}
          </p>
        </header>

        {publishedArticles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/60 py-20 text-center px-6">
            <p className="font-serif text-xl text-foreground">No stories yet</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {shortBio}
            </p>
            <Link
              href="/latest"
              className="mt-6 inline-block text-sm font-semibold text-[#4F63E8] hover:underline"
            >
              Browse latest news →
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border border-t border-border bg-background rounded-sm">
              {pageArticles.map((article) => (
                <ArticleListRow
                  key={article.id}
                  article={article}
                  className="py-8 first:pt-6"
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-8">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Page <span className="text-foreground font-semibold">{page}</span>{" "}
                  of{" "}
                  <span className="text-foreground font-semibold">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={cn(
                      "px-4 py-2 text-[11px] uppercase tracking-[0.12em] font-semibold rounded-sm border transition-colors",
                      !canPrev
                        ? "bg-card text-muted-foreground border-border opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary hover:text-primary",
                    )}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => setPage((p) => p + 1)}
                    className={cn(
                      "px-4 py-2 text-[11px] uppercase tracking-[0.12em] font-semibold rounded-sm border transition-colors",
                      !canNext
                        ? "bg-card text-muted-foreground border-border opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary hover:text-primary",
                    )}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}

      </div>
    </div>
  );
}
