"use client";

import { Search as SearchIcon, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/editorial/PageHeader";
import { DividerLabel } from "@/components/editorial/DividerLabel";
import { ArticleListRow } from "@/components/editorial/ArticleListRow";
import { usePublishedArticles } from "@/hooks/use-published-articles";
import { sanitizeSearchQuery } from "@/lib/security/safe-url";
import { paginateArticles, searchArticles } from "@/lib/site-articles";
import type { Article } from "@/store/articles-context";

const SEARCH_DEBOUNCE_MS = 300;

export default function Search() {
  const published = usePublishedArticles();
  const router = useRouter();
  const sp = useSearchParams();
  const initialQ = sanitizeSearchQuery(sp.get("q") ?? "");

  /** Immediate — keeps typing responsive. */
  const [input, setInput] = useState(initialQ);
  /** Debounced — drives filtering and URL updates. */
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const results = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return searchArticles(published, searchQuery);
  }, [published, searchQuery]);

  const { items, totalPages } = useMemo(
    () => paginateArticles(results, page, 12),
    [results, page],
  );

  const trending = useMemo(
    () => [
      "El Nido Development",
      "Local Elections 2026",
      "Climate Change Initiatives",
      "Puerto Princesa Tech Hub",
      "Palawan Tourism Guidelines",
    ],
    [],
  );

  const setSearchInput = useCallback((value: string) => {
    setInput(value);
  }, []);

  const isSearching = input.trim() !== searchQuery;
  const showResults = searchQuery.length >= 2;

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="editorial-container">
        <PageHeader
          title="Search"
          description="Explore the Palawan Daily News archive."
        />

        <div className="relative mb-14 border-b-2 border-border pb-5 flex items-center ">
          <SearchIcon className="w-8 h-8 text-muted-foreground shrink-0 mr-4" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search the archive..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent text-3xl md:text-4xl lg:text-5xl font-serif outline-none placeholder:text-muted-foreground/40 text-foreground"
          />
          {input && (
            <button
              onClick={() => setInput("")}
              className="p-2 hover:bg-secondary rounded-sm transition-colors shrink-0 ml-4"
              aria-label="Clear search"
            >
              <X className="w-7 h-7 text-foreground" />
            </button>
          )}
        </div>

        {showResults && (
          <div className="mb-14">
            <DividerLabel label="Results" />

            {isSearching && (
              <p className="text-sm text-muted-foreground mt-4">Searching…</p>
            )}

            {!isSearching && !items.length && (
              <p className="text-sm text-muted-foreground mt-4">
                No results for “{searchQuery}”.
              </p>
            )}

            {!isSearching && items.length > 0 && (
              <>
                <div className="mt-4 divide-y divide-border border-t border-border">
                  {items.map((a: Article) => (
                    <ArticleListRow
                      key={a.id}
                      article={a}
                      className="py-8 first:pt-6"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] border border-border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
                  >
                    Prev
                  </button>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] border border-border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-6">
              Trending searches
            </h3>
            <ul className="flex flex-col gap-4">
              {trending.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-foreground hover:text-primary cursor-pointer transition-colors font-serif text-xl md:text-2xl"
                  onClick={() => setSearchInput(item)}
                >
                  <span className="w-1.5 h-1.5 bg-primary shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-6">
              Browse categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Environment",
                "Politics",
                "Business",
                "Lifestyle",
                "Technology",
                "Opinion",
              ].map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between border border-border rounded-sm px-4 py-3.5 group cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors"
                  onClick={() => setSearchInput(cat)}
                >
                  <span className="font-medium text-sm uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                    {cat}
                  </span>
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
