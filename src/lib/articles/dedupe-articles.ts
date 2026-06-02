import type { Article } from "@/types/article";

/** Drop duplicate ids (stale client cache sometimes had the same row twice). */
export function dedupeArticlesById(articles: Article[]): Article[] {
  const seen = new Set<string>();
  const out: Article[] = [];
  for (const article of articles) {
    const key = article.id.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(article);
  }
  return out;
}
