import type { Article } from "@/store/articles-context";

function categoryLeaf(segment: string): string {
  if (!segment.includes(">")) return segment.trim();
  const parts = segment.split(">").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? segment.trim();
}

/** True when any WP category segment is Opinion or Column. */
export function isOpinionOrColumnCategory(raw: string): boolean {
  return raw
    .split(",")
    .map((s) => categoryLeaf(s).toLowerCase())
    .some((leaf) => leaf === "opinion" || leaf === "column");
}

/**
 * One label from WordPress-style lists.
 * Prefer Opinion/Column when present so compound tags like "Column, Sports"
 * still land on the Opinion page instead of Sports.
 */
export function getPrimaryCategory(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "News";

  const segments = trimmed.split(",").map((s) => s.trim()).filter(Boolean);

  const editorial = segments.find((segment) => {
    const leaf = categoryLeaf(segment).toLowerCase();
    return leaf === "opinion" || leaf === "column";
  });
  if (editorial) return categoryLeaf(editorial);

  return categoryLeaf(segments[segments.length - 1] ?? trimmed);
}

export function isPublished(article: Article) {
  return article.status === "Published";
}

function publicationTimestamp(article: Article): number {
  const parsed = Date.parse(article.date);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Newest first: display date, then last CMS update, then id for stable ties. */
export function compareArticlesByRecency(a: Article, b: Article): number {
  const dateDiff = publicationTimestamp(b) - publicationTimestamp(a);
  if (dateDiff !== 0) return dateDiff;

  const updatedDiff = (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  if (updatedDiff !== 0) return updatedDiff;

  return b.id.localeCompare(a.id);
}

export function sortByDateDesc(articles: Article[]) {
  return [...articles].sort(compareArticlesByRecency);
}

export function getPublishedArticles(articles: Article[]) {
  return sortByDateDesc(articles.filter(isPublished));
}

export function articleMatchesCategory(article: Article, category: string) {
  const target = category.trim().toLowerCase();
  if (!target || target === "all") return true;
  const primary = getPrimaryCategory(article.category).toLowerCase();
  const full = (article.category ?? "").toLowerCase();
  return (
    primary === target ||
    full === target ||
    full.includes(target) ||
    primary.includes(target)
  );
}

export function filterByCategory(articles: Article[], category: string) {
  if (!category || category.toLowerCase() === "all") return articles;
  return articles.filter((a) => articleMatchesCategory(a, category));
}

/** Related stories: published peers in the same category, newest first. */
export function getRelatedArticles(
  articles: Article[],
  current: Article,
  limit = 3,
): Article[] {
  const targetCategory = getPrimaryCategory(current.category);
  return getPublishedArticles(articles)
    .filter(
      (a) =>
        a.id.toLowerCase() !== current.id.toLowerCase() &&
        articleMatchesCategory(a, targetCategory),
    )
    .slice(0, limit);
}

export function searchArticles(articles: Article[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return articles;
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q),
  );
}

export function paginateArticles<T>(items: T[], page: number, perPage: number) {
  const safePage = Math.max(1, page);
  const safePerPage = Math.max(1, perPage);
  const start = (safePage - 1) * safePerPage;
  return {
    items: items.slice(start, start + safePerPage),
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / safePerPage)),
    page: safePage,
    perPage: safePerPage,
  };
}

export function getArticlesByAuthor(articles: Article[], authorName: string) {
  const target = authorName.trim().toLowerCase();
  if (!target) return [];
  return sortByDateDesc(
    articles.filter((a) => isPublished(a) && a.author.toLowerCase() === target),
  );
}

export function formatArticleDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
