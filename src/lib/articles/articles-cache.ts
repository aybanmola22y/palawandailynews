import type { Article } from "@/types/article";

/** Bump when cache shape/invalidation rules change (forces clients to refetch). */
export const ARTICLES_SUMMARIES_CACHE_KEY = "pdn-articles-summaries-v5";
const CACHE_KEY = ARTICLES_SUMMARIES_CACHE_KEY;
/** Bumped on admin writes so other tabs drop stale lists. */
export const ARTICLES_CACHE_BUST_KEY = "pdn-articles-cache-bust";
const CACHE_TTL_MS = 30 * 60 * 1000;

type CachePayload = {
  savedAt: number;
  bust: string;
  articles: Article[];
};

let memoryCache: Article[] | null = null;
let memorySavedAt = 0;
let memoryBust = "";

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

function clearLegacySessionCache() {
  if (typeof window === "undefined") return;
  try {
      sessionStorage.removeItem(CACHE_KEY);
      sessionStorage.removeItem("pdn-articles-summaries-v1");
      sessionStorage.removeItem("pdn-articles-summaries-v2");
      localStorage.removeItem("pdn-articles-summaries-v2");
      localStorage.removeItem("pdn-articles-summaries-v3");
      localStorage.removeItem("pdn-articles-summaries-v4");
  } catch {
    /* ignore */
  }
}

export function isArticlesCacheFresh(): boolean {
  const bust = readBustToken();
  if (memoryCache && isFresh(memorySavedAt) && memoryBust === bust) return true;
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as CachePayload;
    return Boolean(
      parsed?.articles?.length &&
        isFresh(parsed.savedAt) &&
        isBustCurrent(parsed.bust ?? ""),
    );
  } catch {
    return false;
  }
}

export function readArticlesCache(): Article[] | null {
  const bust = readBustToken();

  if (memoryCache && isFresh(memorySavedAt) && memoryBust === bust) {
    return memoryCache;
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
    return parsed.articles;
  } catch {
    return null;
  }
}

export function writeArticlesCache(articles: Article[]) {
  const bust = readBustToken();
  memoryCache = articles;
  memorySavedAt = Date.now();
  memoryBust = bust;

  if (typeof window === "undefined") return;

  try {
    const payload: CachePayload = {
      savedAt: memorySavedAt,
      bust,
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
