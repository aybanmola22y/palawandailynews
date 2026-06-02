import type { ArticleInsert } from "@/types/article";

/** URL-safe article id (matches imported WordPress-style slugs). */
export function slugifyArticleId(title: string, fallback?: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

  if (base) return base;
  return fallback?.trim() || `article-${Date.now()}`;
}

/** Store ISO timestamps in Supabase for consistent sorting. */
export function normalizeArticleDateForDb(date: string | undefined): string {
  const trimmed = date?.trim() ?? "";
  if (!trimmed) return new Date().toISOString();

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  return new Date().toISOString();
}

export function validateArticleForPersist(article: ArticleInsert): string | null {
  if (!article.title?.trim()) return "Title is required.";
  if (!article.category?.trim()) return "Category is required.";
  if (!article.author?.trim()) return "Author is required.";
  if (!article.status?.trim()) return "Status is required.";
  return null;
}
