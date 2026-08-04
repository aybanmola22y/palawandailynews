"use client";

import Link from "next/link";
import { ArrowUpRight, Search as SearchIcon, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/editorial/PageHeader";
import { PageShell } from "@/components/editorial/PageShell";
import { ArticleListRow } from "@/components/editorial/ArticleListRow";
import { PopularNewsSidebar } from "@/components/editorial/PopularNewsSidebar";
import { SidebarPanel } from "@/components/editorial/SidebarPanel";
import { usePopularNewsArticles } from "@/hooks/use-popular-news-articles";
import { sanitizeSearchQuery } from "@/lib/security/safe-url";
import { cn } from "@/lib/utils";
import {
  PUBLIC_SEARCH_MAX_PAGE,
  PUBLIC_SEARCH_MIN_QUERY,
  PUBLIC_SEARCH_PAGE_SIZE,
  type PublishedSearchResult,
} from "@/lib/articles/search-published-shared";
import type { Article } from "@/store/articles-context";

/** Slightly longer than before — fewer requests while typing (egress-friendly). */
const SEARCH_DEBOUNCE_MS = 450;

type SearchResponse = PublishedSearchResult & { query?: string; error?: string };

const TOPIC_CHIPS = [
  { label: "Environment", action: { type: "link", href: "/latest?topic=Environment" } },
  { label: "Business", action: { type: "link", href: "/latest?topic=Business" } },
  { label: "Politics", action: { type: "query", q: "Politics" } },
  { label: "Lifestyle", action: { type: "link", href: "/lifestyle" } },
  { label: "Opinion", action: { type: "link", href: "/opinion" } },
  { label: "Legal", action: { type: "link", href: "/legal" } },
] as const;

const SECTION_LINKS = [
  { label: "Latest News", href: "/latest" },
  { label: "Opinion", href: "/opinion" },
  { label: "Lifestyle", href: "/lifestyle" },
  { label: "Legal notices", href: "/legal" },
] as const;

function SearchSidebar({ popular }: { popular: Article[] }) {
  return (
    <div className="flex flex-col gap-10 xl:sticky xl:top-24 xl:self-start">
      <SidebarPanel title="Popular stories">
        {popular.length > 0 ? (
          <PopularNewsSidebar articles={popular.slice(0, 6)} variant="wide" />
        ) : (
          <p className="text-sm text-muted-foreground">Loading stories…</p>
        )}
      </SidebarPanel>

      <SidebarPanel title="Browse">
        <nav aria-label="Site sections">
          <ul className="divide-y divide-border">
            {SECTION_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group flex items-center justify-between gap-3 py-3 text-[15px] text-foreground/85 transition-colors hover:text-primary"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SidebarPanel>
    </div>
  );
}

export default function Search() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialQ = sanitizeSearchQuery(sp.get("q") ?? "");
  const popular = usePopularNewsArticles();

  const [input, setInput] = useState(initialQ);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Article[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const next = sanitizeSearchQuery(input);
    const timer = window.setTimeout(() => {
      setSearchQuery(next);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    const q = searchQuery;
    const url = q ? `/search?q=${encodeURIComponent(q)}` : "/search";
    const current = (sp.get("q") ?? "").trim();
    if (q === current) return;
    router.replace(url, { scroll: false });
  }, [searchQuery, router, sp]);

  useEffect(() => {
    if (searchQuery.trim().length < PUBLIC_SEARCH_MIN_QUERY) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          page: String(page),
          limit: String(PUBLIC_SEARCH_PAGE_SIZE),
        });
        const res = await fetch(`/api/articles/search?${params}`, {
          method: "GET",
          credentials: "same-origin",
          signal: controller.signal,
        });
        const data = (await res.json()) as SearchResponse;
        if (requestId !== requestIdRef.current) return;

        if (!res.ok) {
          throw new Error(data.error || `Search failed (${res.status})`);
        }

        setItems(Array.isArray(data.articles) ? data.articles : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
        setTotalPages(
          Math.min(
            Math.max(1, data.totalPages ?? 1),
            PUBLIC_SEARCH_MAX_PAGE,
          ),
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        if (requestId !== requestIdRef.current) return;
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [searchQuery, page]);

  const setSearchInput = useCallback((value: string) => {
    setInput(value);
    inputRef.current?.focus();
  }, []);

  const isDebouncing = input.trim() !== searchQuery;
  const showResults = searchQuery.length >= PUBLIC_SEARCH_MIN_QUERY;
  const busy = loading || isDebouncing;

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <PageShell layout="wideSidebar" sidebar={<SearchSidebar popular={popular} />}>
        <PageHeader
          title="Search"
          description="Search the published archive by title, author, or category."
        />

        <div className="relative mb-6">
          <SearchIcon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search stories, authors, topics…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full border border-border bg-card py-3.5 pl-10 pr-11 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            aria-label="Search the archive"
            autoComplete="off"
            spellCheck={false}
          />
          {input ? (
            <button
              type="button"
              onClick={() => setInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mb-10 flex flex-wrap gap-2">
          {TOPIC_CHIPS.map((chip) => {
            if (chip.action.type === "link") {
              return (
                <Link
                  key={chip.label}
                  href={chip.action.href}
                  className="rounded-sm border border-border bg-card px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  {chip.label}
                </Link>
              );
            }

            const query = chip.action.q;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => setSearchInput(query)}
                className="rounded-sm border border-border bg-card px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {showResults ? (
          <section aria-live="polite">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Results
              </h2>
              {!busy && !error && items.length > 0 ? (
                <p className="text-[12px] text-muted-foreground">
                  {total.toLocaleString()}{" "}
                  {total === 1 ? "story" : "stories"}
                  {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
                </p>
              ) : null}
            </div>

            {busy ? (
              <p className="py-8 text-sm text-muted-foreground">
                Searching the archive…
              </p>
            ) : null}

            {!busy && error ? (
              <p className="py-8 text-sm text-destructive">{error}</p>
            ) : null}

            {!busy && !error && !items.length ? (
              <p className="py-8 text-sm text-muted-foreground">
                No results for “{searchQuery}”. Try another keyword or clear the
                search.
              </p>
            ) : null}

            {!busy && !error && items.length > 0 ? (
              <>
                <div className="divide-y divide-border border-t border-border">
                  {items.map((a) => (
                    <ArticleListRow
                      key={a.id}
                      article={a}
                      className="py-8 first:pt-6"
                    />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-8">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Page{" "}
                      <span className="font-semibold text-foreground">{page}</span>{" "}
                      of{" "}
                      <span className="font-semibold text-foreground">
                        {totalPages}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1 || busy}
                        className={cn(
                          "rounded-sm border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                          page <= 1 || busy
                            ? "cursor-not-allowed border-border opacity-50"
                            : "border-border hover:border-foreground/30",
                        )}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages || busy}
                        className={cn(
                          "rounded-sm border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                          page >= totalPages || busy
                            ? "cursor-not-allowed border-border opacity-50"
                            : "border-border hover:border-foreground/30",
                        )}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </section>
        ) : (
          <section className="rounded-sm border border-dashed border-border bg-secondary/30 px-6 py-12 text-center sm:px-10">
            <p className="font-serif text-xl text-foreground">
              Type a keyword to search the archive
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Results appear here. Use the topic chips above, or browse popular
              stories and sections on the right.
            </p>
          </section>
        )}
      </PageShell>
    </div>
  );
}
