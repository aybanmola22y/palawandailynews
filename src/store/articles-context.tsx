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
  clearArticlesCache,
  isArticlesCacheFresh,
  readArticlesCache,
  writeArticlesCache,
} from "@/lib/articles/articles-cache";
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
  addArticle: (article: ArticleInsert) => Promise<void>;
  updateArticle: (id: string, changes: ArticleUpdate) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
}

const ArticlesContext = createContext<ArticlesContextType | null>(null);

export function ArticlesProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const needsFullContent = pathname.startsWith("/admin");

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

    if (needsFullContent) {
      setLoading(true);
      try {
        const list = await repo.list();
        if (mounted.current) setArticles(list);
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
      setArticles(cached);
      setLoading(false);
      if (isArticlesCacheFresh()) {
        setArchiveLoading(false);
        return;
      }
    } else if (mounted.current) {
      setLoading(true);
    }

    try {
      if (!cached?.length) {
        const bootstrap = await loadPublicSummariesBootstrap();
        if (mounted.current && bootstrap.length) {
          setArticles(bootstrap);
          setLoading(false);
        }
      }

      if (mounted.current) setArchiveLoading(true);

      const full = await loadPublicSummariesFull();
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
  }, [repo, needsFullContent]);

  const ensureArticleContent = useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured()) return;

      const existing = articlesRef.current.find(
        (a) => a.id.toLowerCase() === id.toLowerCase(),
      );
      if (!needsFullContent && existing?.content?.trim()) return;
      if (loadingContentIds.current.has(id)) return;

      loadingContentIds.current.add(id);
      try {
        const full = needsFullContent
          ? await fetchAdminArticle(id)
          : await repo.getById(id);
        if (full && mounted.current) {
          setArticles((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ...full } : a)),
          );
        }
      } catch {
        /* body stays empty; article page can still show excerpt */
      } finally {
        loadingContentIds.current.delete(id);
      }
    },
    [repo, needsFullContent],
  );

  useEffect(() => {
    mounted.current = true;
    void refreshArticles();
    return () => {
      mounted.current = false;
    };
  }, [refreshArticles]);

  function addArticle(article: ArticleInsert): Promise<void> {
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
      updatedAt: Date.now(),
    };
    setArticles((prev) => [optimistic, ...prev]);

    const persist = needsFullContent
      ? createAdminArticle(article)
      : repo.create(article);

    return persist
      .then((created) => {
        setArticles((prev) =>
          prev.map((a) => (a.id === tempId ? created : a)),
        );
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

    const persist = needsFullContent
      ? patchAdminArticle(id, changes)
      : repo.update(id, changes);

    return persist
      .then((saved) => {
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

    const persist = needsFullContent ? deleteAdminArticle(id) : repo.delete(id);

    return persist.catch((err) => {
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
