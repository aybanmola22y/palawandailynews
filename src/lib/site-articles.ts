import type { Article } from "@/store/articles-context";

/** One label from WordPress-style lists: "City News, City News > Puerto Princesa, Environment" → "Environment" */
export function getPrimaryCategory(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "News";

  const segments = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  let pick = segments[segments.length - 1] ?? trimmed;

  if (pick.includes(">")) {
    const parts = pick.split(">").map((s) => s.trim()).filter(Boolean);
    pick = parts[parts.length - 1] ?? pick;
  }

  return pick;
}

export function isPublished(article: Article) {
  return article.status === "Published";
}

export function sortByDateDesc(articles: Article[]) {
  return [...articles].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function getPublishedArticles(articles: Article[]) {
  return sortByDateDesc(articles.filter(isPublished));
}

export function filterByCategory(articles: Article[], category: string) {
  if (!category || category.toLowerCase() === "all") return articles;
  const target = category.toLowerCase();
  return articles.filter((a) => {
    const primary = getPrimaryCategory(a.category).toLowerCase();
    return (
      primary === target ||
      a.category.toLowerCase() === target ||
      a.category.toLowerCase().includes(target)
    );
  });
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
