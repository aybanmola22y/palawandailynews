import type { Article } from "@/types/article";

/** Bump when cache shape/invalidation rules change (forces clients to refetch). */
export const ARTICLES_SUMMARIES_CACHE_KEY = "pdn-articles-summaries-v10";
const CACHE_KEY = ARTICLES_SUMMARIES_CACHE_KEY;
/** Bumped on admin writes so other tabs drop stale lists. */
export const ARTICLES_CACHE_BUST_KEY = "pdn-articles-cache-bust";
/**
 * How long a cached list may be shown instantly (stale-while-revalidate).
 * Network refresh still runs in the background so new publishes appear quickly.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

type CachePayload = {
  savedAt: number;
  bust: string;
  /** False when only the bootstrap slice (~400 rows) is cached. */
  complete: boolean;
  articles: Article[];
};

let memoryCache: Article[] | null = null;
let memorySavedAt = 0;
let memoryBust = "";
let memoryComplete = false;

function isFresh(savedAt: number) {
  return Date.now() - savedAt < CACHE_TTL_MS;
}

function readBustToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(ARTICLES_CACHE_BUST_KEY) ?? "";
  } catch {
    return "";
  }
}

function isBustCurrent(bust: string) {
  const current = readBustToken();
  if (!current || !bust) return false;
  return bust === current;
}

function readPayload(): CachePayload | null {
  const bust = readBustToken();

  if (memoryCache && isFresh(memorySavedAt) && memoryBust === bust) {
    return {
      savedAt: memorySavedAt,
      bust: memoryBust,
      complete: memoryComplete,
      articles: memoryCache,
    };
  }

  if (typeof window === "undefined") return null;

  clearLegacySessionCache();

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (
      !parsed?.articles?.length ||
      !isFresh(parsed.savedAt) ||
      !isBustCurrent(parsed.bust ?? "")
    ) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    memoryCache = parsed.articles;
    memorySavedAt = parsed.savedAt;
    memoryBust = parsed.bust;
    memoryComplete = parsed.complete === true;
    return parsed;
  } catch {
    return null;
  }
}

function clearLegacySessionCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem("pdn-articles-summaries-v1");
    sessionStorage.removeItem("pdn-articles-summaries-v2");
    localStorage.removeItem("pdn-articles-summaries-v2");
    localStorage.removeItem("pdn-articles-summaries-v3");
    localStorage.removeItem("pdn-articles-summaries-v4");
    localStorage.removeItem("pdn-articles-summaries-v5");
    localStorage.removeItem("pdn-articles-summaries-v6");
      localStorage.removeItem("pdn-articles-summaries-v7");
      localStorage.removeItem("pdn-articles-summaries-v8");
      localStorage.removeItem("pdn-articles-summaries-v9");
  } catch {
    /* ignore */
  }
}

export function isArticlesCacheFresh(): boolean {
  return Boolean(readPayload()?.articles.length);
}

export function isArticlesCacheComplete(): boolean {
  return readPayload()?.complete === true;
}

export function readArticlesCache(): Article[] | null {
  return readPayload()?.articles ?? null;
}

export function writeArticlesCache(articles: Article[], complete = true) {
  const bust = readBustToken();
  memoryCache = articles;
  memorySavedAt = Date.now();
  memoryBust = bust;
  memoryComplete = complete;

  if (typeof window === "undefined") return;

  try {
    const payload: CachePayload = {
      savedAt: memorySavedAt,
      bust,
      complete,
      articles,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota exceeded — in-memory cache still helps this session */
  }
}

export function clearArticlesCache() {
  memoryCache = null;
  memorySavedAt = 0;
  memoryBust = "";
  memoryComplete = false;

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.setItem(ARTICLES_CACHE_BUST_KEY, String(Date.now()));
      clearLegacySessionCache();
    } catch {
      /* ignore */
    }
  }
}
