"use client";

import { useEffect, useMemo, useState } from "react";
import { POPULAR_NEWS_ARTICLE_IDS } from "@/data/popular-news";
import { isSupabaseConfigured } from "@/lib/articles";
import type { Article } from "@/types/article";
import { usePublishedArticles } from "@/hooks/use-published-articles";

function orderPopularArticles(source: Map<string, Article>): Article[] {
  return POPULAR_NEWS_ARTICLE_IDS.map((id) => source.get(id.toLowerCase())).filter(
    (article): article is Article => Boolean(article),
  );
}

export function usePopularNewsArticles() {
  const published = usePublishedArticles();
  const [fetched, setFetched] = useState<Article[]>([]);

  const fromPublished = useMemo(() => {
    const byId = new Map(published.map((a) => [a.id.toLowerCase(), a]));
    return orderPopularArticles(byId);
  }, [published]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (fromPublished.length >= POPULAR_NEWS_ARTICLE_IDS.length) {
      setFetched([]);
      return;
    }

    let cancelled = false;

    void fetch("/api/articles/popular")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load popular news");
        return (await res.json()) as Article[];
      })
      .then((list) => {
        if (!cancelled && Array.isArray(list)) setFetched(list);
      })
      .catch(() => {
        if (!cancelled) setFetched([]);
      });

    return () => {
      cancelled = true;
    };
  }, [fromPublished.length]);

  return useMemo(() => {
    if (fromPublished.length >= POPULAR_NEWS_ARTICLE_IDS.length) {
      return fromPublished;
    }

    const byId = new Map<string, Article>();
    for (const article of fromPublished) {
      byId.set(article.id.toLowerCase(), article);
    }
    for (const article of fetched) {
      byId.set(article.id.toLowerCase(), article);
    }
    return orderPopularArticles(byId);
  }, [fromPublished, fetched]);
}
