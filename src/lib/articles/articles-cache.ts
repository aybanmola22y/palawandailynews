import type { Article } from "@/types/article";

const CACHE_KEY = "pdn-articles-summaries-v2";
const CACHE_TTL_MS = 30 * 60 * 1000;

type CachePayload = {
  savedAt: number;
  articles: Article[];
};

let memoryCache: Article[] | null = null;
let memorySavedAt = 0;

function isFresh(savedAt: number) {
  return Date.now() - savedAt < CACHE_TTL_MS;
}

export function isArticlesCacheFresh(): boolean {
  if (memoryCache && isFresh(memorySavedAt)) return true;
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as CachePayload;
    return Boolean(parsed?.articles?.length && isFresh(parsed.savedAt));
  } catch {
    return false;
  }
}

export function readArticlesCache(): Article[] | null {
  if (memoryCache && isFresh(memorySavedAt)) {
    return memoryCache;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed?.articles?.length || !isFresh(parsed.savedAt)) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    memoryCache = parsed.articles;
    memorySavedAt = parsed.savedAt;
    return parsed.articles;
  } catch {
    return null;
  }
}

export function writeArticlesCache(articles: Article[]) {
  memoryCache = articles;
  memorySavedAt = Date.now();

  if (typeof window === "undefined") return;

  try {
    const payload: CachePayload = { savedAt: memorySavedAt, articles };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota exceeded — in-memory cache still helps this session */
  }
}

export function clearArticlesCache() {
  memoryCache = null;
  memorySavedAt = 0;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(CACHE_KEY);
      sessionStorage.removeItem("pdn-articles-summaries-v1");
    } catch {
      /* ignore */
    }
  }
}
