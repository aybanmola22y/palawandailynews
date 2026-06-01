"use client";

import { useEffect, useState } from "react";
import { POPULAR_NEWS_ARTICLE_IDS } from "@/data/popular-news";
import { getArticlesRepository, isSupabaseConfigured } from "@/lib/articles";
import type { Article } from "@/types/article";

export function usePopularNewsArticles() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;

    void getArticlesRepository()
      .listByIds([...POPULAR_NEWS_ARTICLE_IDS])
      .then((list) => {
        if (!cancelled) setArticles(list.filter((a) => a.status === "Published"));
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return articles;
}
