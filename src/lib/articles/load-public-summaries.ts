import type { Article } from "@/types/article";
import { withResolvedArticleImages } from "@/lib/articles/map-article-row";

const API_PATH = "/api/articles/summaries";

/** Recent slice for public browsing; keep small to protect the 5 GB Supabase egress quota. */
export const PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT = 150;

async function fetchSummariesFromApi(limit?: number): Promise<Article[]> {
  const url =
    limit != null && limit > 0
      ? `${API_PATH}?limit=${limit}`
      : API_PATH;

  const res = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Unable to load articles");
  }

  const data = (await res.json()) as Article[];
  if (!Array.isArray(data)) {
    throw new Error("Unable to load articles");
  }

  return withResolvedArticleImages(data);
}

/** First paint — recent summaries via cached API route (not direct Supabase). */
export async function loadPublicSummariesBootstrap(): Promise<Article[]> {
  return fetchSummariesFromApi(PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT);
}

/** Full published archive — only when search/category/author pages need it. */
export async function loadPublicSummariesFull(): Promise<Article[]> {
  return fetchSummariesFromApi();
}
