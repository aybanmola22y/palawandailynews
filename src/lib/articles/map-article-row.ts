import type { Article, ArticleStatus } from "@/types/article";
import type { ArticleInsertRow, ArticleRow } from "@/lib/supabase/database.types";
import { resolveAuthorDisplayName } from "@/lib/author-resolve";
import { normalizeArticleDateForDb } from "@/lib/articles/article-persist";
import { excerptToPlainText } from "@/lib/html-editor-content";
import { getPrimaryCategory } from "@/lib/site-articles";
import { getMediaBaseUrl } from "@/lib/supabase/env";

const STATUSES: ArticleStatus[] = ["Published", "Draft", "Review"];

/** Normalize tags from DB array, JSON string, or comma/pipe-separated text (imports). */
export function normalizeArticleTags(raw: unknown): string[] {
  if (raw == null) return [];

  if (Array.isArray(raw)) {
    const tags = raw
      .map((t) => String(t).trim())
      .filter(Boolean);
    return [...new Set(tags)].slice(0, 30);
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    if (s.startsWith("[") || s.startsWith("{")) {
      try {
        const parsed = JSON.parse(s) as unknown;
        return normalizeArticleTags(parsed);
      } catch {
        /* fall through */
      }
    }
    const tags = s
      .split(/[|,]/g)
      .map((t) => t.trim())
      .filter(Boolean);
    return [...new Set(tags)].slice(0, 30);
  }

  return [];
}

function normalizeStatus(value: string): ArticleStatus {
  return STATUSES.includes(value as ArticleStatus)
    ? (value as ArticleStatus)
    : "Published";
}

const HOSTINGER_SITE_HOST = /^(https?:\/\/(?:www\.)?palawandailynews\.com)\//i;

function fixPalawanSiteUrl(url: string): string {
  const host = url.match(/^(https?:\/\/(?:www\.)?palawandailynews\.com)\//i);
  if (!host) return url;

  const [, base] = host;
  let fixed = url;

  if (fixed.startsWith("http://")) {
    fixed = fixed.replace(/^http:/i, "https:");
  }

  // Wrong nested folder from an earlier bug: /public_html/pdn_new_website_uploads → /pdn_new_website_uploads
  if (/\/public_html\/pdn_new_website_uploads\//i.test(fixed)) {
    fixed = fixed.replace(
      `${base}/public_html/pdn_new_website_uploads/`,
      `${base}/pdn_new_website_uploads/`,
    );
  }
  if (/\/public_html\/uploads\//i.test(fixed)) {
    fixed = fixed.replace(
      `${base}/public_html/uploads/`,
      `${base}/pdn_new_website_uploads/`,
    );
  }

  return fixed;
}

/** Resolve image URL — store full Hostinger URLs in Supabase; optionally prefix relative paths. */
export function resolveImageUrl(image: string): string {
  let trimmed = String(image ?? "").trim();
  if (!trimmed) return "";

  // Local draft previews (admin editor) — do not rewrite to Hostinger base URL.
  if (/^(blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    trimmed = `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return fixPalawanSiteUrl(trimmed);
  }

  const base = getMediaBaseUrl();
  const normalized = trimmed.replace(/^\//, "");

  if (normalized.startsWith("public_html/pdn_new_website_uploads/")) {
    return `${base}/${normalized.replace(/^public_html\//, "")}`;
  }
  if (normalized.startsWith("public_html/uploads/")) {
    return `${base}/${normalized.replace(/^public_html\/uploads\//, "pdn_new_website_uploads/")}`;
  }
  if (normalized.startsWith("wp-content/uploads/")) {
    return `${base}/${normalized}`;
  }
  if (
    normalized.startsWith("pdn_new_website_uploads/") ||
    HOSTINGER_SITE_HOST.test(base)
  ) {
    return `${base}/${normalized}`;
  }
  return `${base}/${normalized}`;
}

/** Re-apply URL rules (e.g. after loading from localStorage cache). */
export function withResolvedArticleImages<T extends { image?: string }>(
  articles: T[],
): T[] {
  return articles.map((article) => ({
    ...article,
    image: article.image ? resolveImageUrl(article.image) : "",
  }));
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
    date: normalizeArticleDateForDb(article.date),
    reading_time: article.readingTime,
    image_url: resolveImageUrl(article.image),
    is_breaking: article.isBreaking,
    status: article.status,
    legacy_wp_id: article.legacyWpId ?? null,
    cms_origin: article.cmsOrigin === true,
    updated_at: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

export function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    excerpt: excerptToPlainText(row.excerpt ?? ""),
    content: row.content ?? "",
    category: getPrimaryCategory(row.category ?? "News"),
    author: resolveAuthorDisplayName(row.author ?? ""),
    tags: normalizeArticleTags(row.tags),
    date: row.date,
    readingTime: row.reading_time ?? "",
    image: resolveImageUrl(row.image_url ?? ""),
    isBreaking: Boolean(row.is_breaking),
    status: normalizeStatus(row.status),
    updatedAt: Date.parse(row.updated_at) || undefined,
    legacyWpId: row.legacy_wp_id ?? undefined,
    cmsOrigin: row.cms_origin === true,
  };
}
