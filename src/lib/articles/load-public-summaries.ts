import type { Article } from "@/types/article";
import { withResolvedArticleImages } from "@/lib/articles/map-article-row";

const API_PATH = "/api/articles/summaries";

/** Recent slice for public browsing; keep small to protect the 5 GB Supabase egress quota. */
export const PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT = 150;

async function fetchSummariesFromApi(): Promise<Article[]> {
  const res = await fetch(`${API_PATH}?limit=${PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
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

/** Public article lists — capped, cached API route (never the full archive). */
export async function loadPublicSummariesBootstrap(): Promise<Article[]> {
  return fetchSummariesFromApi();
}

/** @deprecated Public site no longer loads the full archive. */
export async function loadPublicSummariesFull(): Promise<Article[]> {
  return loadPublicSummariesBootstrap();
}
