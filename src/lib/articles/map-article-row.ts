import type { Article, ArticleStatus } from "@/types/article";
import type { ArticleInsertRow, ArticleRow } from "@/lib/supabase/database.types";
import { resolveAuthorDisplayName } from "@/lib/author-resolve";
import { getPrimaryCategory } from "@/lib/site-articles";
import { getMediaBaseUrl } from "@/lib/supabase/env";

const STATUSES: ArticleStatus[] = ["Published", "Draft", "Review"];

function normalizeStatus(value: string): ArticleStatus {
  return STATUSES.includes(value as ArticleStatus)
    ? (value as ArticleStatus)
    : "Published";
}

/** Resolve image URL — store full Hostinger URLs in Supabase; optionally prefix relative paths. */
export function resolveImageUrl(image: string): string {
  const trimmed = image.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = getMediaBaseUrl();
  if (!base) return trimmed;
  return `${base}/${trimmed.replace(/^\//, "")}`;
}

export function articleToRow(article: Article): ArticleInsertRow {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    author: article.author,
    tags: article.tags ?? [],
    date: article.date,
    reading_time: article.readingTime,
    image_url: resolveImageUrl(article.image),
    is_breaking: article.isBreaking,
    status: article.status,
    legacy_wp_id: article.legacyWpId ?? null,
    updated_at: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

export function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    category: getPrimaryCategory(row.category ?? "News"),
    author: resolveAuthorDisplayName(row.author ?? ""),
    tags: row.tags ?? [],
    date: row.date,
    readingTime: row.reading_time ?? "",
    image: row.image_url ?? "",
    isBreaking: Boolean(row.is_breaking),
    status: normalizeStatus(row.status),
    updatedAt: Date.parse(row.updated_at) || undefined,
    legacyWpId: row.legacy_wp_id ?? undefined,
  };
}
