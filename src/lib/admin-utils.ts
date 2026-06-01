import type { Article, ArticleStatus } from "@/store/articles-context";

const MIN_VALID_MS = Date.parse("2020-01-01");

function validTimestamp(ts?: number) {
  return typeof ts === "number" && ts >= MIN_VALID_MS;
}

function articlePublicationTimestamp(article: Article): number | null {
  const parsed = Date.parse(article.date);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Editorial changes (draft saves, reviews) — uses last CMS update. */
function articleEditorialTimestamp(article: Article): number | null {
  if (validTimestamp(article.updatedAt)) return article.updatedAt!;
  return articlePublicationTimestamp(article);
}

/**
 * When an article was "active" for sorting.
 * Published stories use publication date — not `updated_at` from imports/sync.
 */
export function articleActivityTimestamp(article: Article): number | null {
  if (article.status === "Published") {
    return articlePublicationTimestamp(article);
  }
  return articleEditorialTimestamp(article);
}

export function formatArticleActivityTime(article: Article) {
  if (article.status === "Published" && article.date) {
    const published = articlePublicationTimestamp(article);
    if (published) {
      const daysAgo = Math.floor((Date.now() - published) / 86_400_000);
      if (daysAgo > 13) {
        return formatAdminDateTime(article.date);
      }
      return formatTimeAgo(published);
    }
  }

  const ts = articleEditorialTimestamp(article);
  if (ts) return formatTimeAgo(ts);
  return article.date ? formatAdminDateTime(article.date) : "Recently";
}

export function formatTimeAgo(timestamp?: number) {
  if (!validTimestamp(timestamp)) return "Recently";
  const diff = Date.now() - timestamp!;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatAdminDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  // Example: May 18, 2026 · 2:44 PM
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} · ${time}`;
}

export function activityLabel(status: ArticleStatus | "") {
  switch (status) {
    case "Published":
      return "published an article";
    case "Draft":
      return "saved a draft";
    case "Review":
      return "submitted for review";
    default:
      return "updated an article";
  }
}

export function sortArticlesByRecent(articles: Article[]) {
  return [...articles].sort((a, b) => {
    const ta = articleActivityTimestamp(a) ?? 0;
    const tb = articleActivityTimestamp(b) ?? 0;
    return tb - ta;
  });
}
