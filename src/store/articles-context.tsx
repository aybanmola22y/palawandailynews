"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { Article, ArticleInsert, ArticleStatus, ArticleUpdate } from "@/types/article";
import {
  ARTICLES_CACHE_BUST_KEY,
  ARTICLES_SUMMARIES_CACHE_KEY,
  clearArticlesCache,
  readArticlesCache,
  writeArticlesCache,
} from "@/lib/articles/articles-cache";
import { dedupeArticlesById } from "@/lib/articles/dedupe-articles";
import { withResolvedArticleImages } from "@/lib/articles/map-article-row";
import {
  loadAdminSummariesBootstrap,
  loadAdminSummariesFull,
} from "@/lib/articles/load-admin-summaries";
import {
  loadPublicSummariesBootstrap,
  loadPublicSummariesFull,
} from "@/lib/articles/load-public-summaries";
import { getPublishedArticles } from "@/lib/site-articles";
import {
  createAdminArticle,
  deleteAdminArticle,
  fetchAdminArticle,
  patchAdminArticle,
} from "@/lib/articles/admin-article-api";
import {
  getArticlesRepository,
  isSupabaseConfigured,
  SUPABASE_NOT_CONFIGURED_MSG,
} from "@/lib/articles";

export type { Article, ArticleStatus } from "@/types/article";

interface ArticlesContextType {
  articles: Article[];
  publishedArticles: Article[];
  loading: boolean;
  archiveLoading: boolean;
  error: string | null;
  refreshArticles: () => Promise<void>;
  ensureArticleContent: (id: string) => Promise<void>;
  addArticle: (article: ArticleInsert) => Promise<Article>;
  updateArticle: (id: string, changes: ArticleUpdate) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
}

const ArticlesContext = createContext<ArticlesContextType | null>(null);

export function ArticlesProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute =
    pathname.startsWith("/admin") && pathname !== "/admin/login";

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const repo = useMemo(() => getArticlesRepository(), []);
  const mounted = useRef(true);
  const articlesRef = useRef<Article[]>([]);
  const loadingContentIds = useRef(new Set<string>());
  const publishedArticles = useMemo(
    () => getPublishedArticles(articles),
    [articles],
  );

  useEffect(() => {
    articlesRef.current = articles;
  }, [articles]);

  const refreshArticles = useCallback(async () => {
    setError(null);
    if (!isSupabaseConfigured()) {
      if (mounted.current) {
        setArticles([]);
        setError(SUPABASE_NOT_CONFIGURED_MSG);
        setLoading(false);
        setArchiveLoading(false);
      }
      return;
    }

    if (isAdminRoute) {
      setLoading(true);
      try {
        const bootstrap = await loadAdminSummariesBootstrap();
        if (mounted.current && bootstrap.length) {
          setArticles(dedupeArticlesById(bootstrap));
          setLoading(false);
        }

        if (mounted.current) setArchiveLoading(true);

        const full = dedupeArticlesById(await loadAdminSummariesFull());
        if (mounted.current) setArticles(full);
      } catch (err) {
        if (mounted.current) {
          setError(err instanceof Error ? err.message : "Failed to load articles");
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
          setArchiveLoading(false);
        }
      }
      return;
    }

    const cached = readArticlesCache();
    if (cached?.length && mounted.current) {
      setArticles(dedupeArticlesById(withResolvedArticleImages(cached)));
      setLoading(false);
    } else if (mounted.current) {
      setLoading(true);
    }

    try {
      if (!cached?.length) {
        const bootstrap = await loadPublicSummariesBootstrap();
        if (mounted.current && bootstrap.length) {
          setArticles(dedupeArticlesById(bootstrap));
          setLoading(false);
        }
      }

      if (mounted.current) setArchiveLoading(true);

      const full = dedupeArticlesById(await loadPublicSummariesFull());
      if (mounted.current) {
        setArticles(full);
        writeArticlesCache(full);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Failed to load articles");
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setArchiveLoading(false);
      }
    }
  }, [repo, isAdminRoute]);

  const ensureArticleContent = useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured()) return;

      const existing = articlesRef.current.find(
        (a) => a.id.toLowerCase() === id.toLowerCase(),
      );
      if (!isAdminRoute && existing?.content?.trim()) return;
      if (loadingContentIds.current.has(id)) return;

      loadingContentIds.current.add(id);
      const normalizedId = id.toLowerCase();
      try {
        const full = isAdminRoute
          ? await fetchAdminArticle(id)
          : await repo.getById(id);
        if (full && mounted.current) {
          setArticles((prev) =>
            prev.map((a) =>
              a.id.toLowerCase() === normalizedId ? { ...a, ...full } : a,
            ),
          );
        }
      } catch {
        /* body stays empty; article page can still show excerpt */
      } finally {
        loadingContentIds.current.delete(id);
      }
    },
    [repo, isAdminRoute],
  );

  useEffect(() => {
    mounted.current = true;
    void refreshArticles();
    return () => {
      mounted.current = false;
    };
  }, [refreshArticles]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (
        event.key === ARTICLES_CACHE_BUST_KEY ||
        event.key === ARTICLES_SUMMARIES_CACHE_KEY
      ) {
        void refreshArticles();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshArticles]);

  function addArticle(article: ArticleInsert): Promise<Article> {
    if (!isSupabaseConfigured()) {
      setError(SUPABASE_NOT_CONFIGURED_MSG);
      return Promise.reject(new Error(SUPABASE_NOT_CONFIGURED_MSG));
    }

    clearArticlesCache();

    const tempId = article.id?.trim() || `temp-${Date.now()}`;
    const optimistic: Article = {
      ...article,
      id: tempId,
      tags: article.tags ?? [],
      cmsOrigin: true,
      updatedAt: Date.now(),
    };
    setArticles((prev) => [optimistic, ...prev]);

    return createAdminArticle(article)
      .then(async (created) => {
        setArticles((prev) =>
          prev.map((a) => (a.id === tempId ? created : a)),
        );
        return created;
      })
      .catch((err) => {
        setArticles((prev) => prev.filter((a) => a.id !== tempId));
        const message = err instanceof Error ? err.message : "Failed to create article";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      });
  }

  function updateArticle(id: string, changes: ArticleUpdate): Promise<void> {
    if (!isSupabaseConfigured()) {
      setError(SUPABASE_NOT_CONFIGURED_MSG);
      return Promise.reject(new Error(SUPABASE_NOT_CONFIGURED_MSG));
    }

    clearArticlesCache();

    const previous = articlesRef.current;
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...changes, updatedAt: Date.now() } : a,
      ),
    );

    return patchAdminArticle(id, changes)
      .then(async (saved) => {
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...saved } : a)),
        );
      })
      .catch((err) => {
        setArticles(previous);
        const message = err instanceof Error ? err.message : "Failed to update article";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      });
  }

  function deleteArticle(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      setError(SUPABASE_NOT_CONFIGURED_MSG);
      return Promise.reject(new Error(SUPABASE_NOT_CONFIGURED_MSG));
    }

    clearArticlesCache();

    const previous = articlesRef.current;
    setArticles((prev) => prev.filter((a) => a.id !== id));

    return deleteAdminArticle(id)
      .catch((err) => {
        setArticles(previous);
        const message = err instanceof Error ? err.message : "Failed to delete article";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      });
  }

  return (
    <ArticlesContext.Provider
      value={{
        articles,
        publishedArticles,
        loading,
        archiveLoading,
        error,
        refreshArticles,
        ensureArticleContent,
        addArticle,
        updateArticle,
        deleteArticle,
      }}
    >
      {children}
    </ArticlesContext.Provider>
  );
}

export function useArticles() {
  const ctx = useContext(ArticlesContext);
  if (!ctx) throw new Error("useArticles must be used inside ArticlesProvider");
  return ctx;
}
