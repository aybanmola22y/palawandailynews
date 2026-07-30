import type { SupabaseClient } from "@supabase/supabase-js";
import type { Article } from "@/types/article";
import type { ArticleRow } from "@/lib/supabase/database.types";
import { rowToArticle } from "@/lib/articles/map-article-row";
import { excerptToPlainText } from "@/lib/html-editor-content";
import type { Database } from "@/lib/supabase/database.types";

export const ARTICLE_SUMMARY_SELECT =
  "id, title, excerpt, category, author, tags, date, reading_time, image_url, is_breaking, status, updated_at, legacy_wp_id, cms_origin";

/** Smaller payload for public list APIs — omits admin/import-only fields. */
export const PUBLIC_ARTICLE_SUMMARY_SELECT =
  "id, title, excerpt, category, author, date, reading_time, image_url, is_breaking, updated_at";

const ARTICLE_SUMMARY_SELECT_LEGACY = ARTICLE_SUMMARY_SELECT.replace(
  ", cms_origin",
  "",
);

/** @deprecated Same as ARTICLE_SUMMARY_SELECT — tags are always loaded. */
export const ADMIN_ARTICLE_SUMMARY_SELECT = ARTICLE_SUMMARY_SELECT;

const PAGE_SIZE = 1000;

function isMissingCmsOriginColumn(message: string | undefined) {
  return Boolean(message?.includes("cms_origin"));
}

let resolvedAdminSummarySelect = ARTICLE_SUMMARY_SELECT;

function adminSummarySelectColumns() {
  return resolvedAdminSummarySelect;
}

function downgradeAdminSummarySelectOnError(error: { message?: string } | null) {
  if (
    resolvedAdminSummarySelect === ARTICLE_SUMMARY_SELECT &&
    isMissingCmsOriginColumn(error?.message)
  ) {
    resolvedAdminSummarySelect = ARTICLE_SUMMARY_SELECT_LEGACY;
    return true;
  }
  return false;
}
const MAX_PAGES = 30;
const LIST_EXCERPT_MAX = 280;

function rowToSummaryArticle(row: ArticleRow): Article {
  const plainExcerpt = excerptToPlainText(row.excerpt ?? "");
  return rowToArticle({
    ...row,
    excerpt: trimListExcerpt(plainExcerpt),
    content: "",
    tags: row.tags ?? [],
    status: row.status ?? "Published",
  });
}

/** Short excerpt for list cards only — do not store this on shared article state. */
export function trimListExcerpt(excerpt: string) {
  const t = excerptToPlainText(excerpt).trim();
  if (t.length <= LIST_EXCERPT_MAX) return t;
  return `${t.slice(0, LIST_EXCERPT_MAX).trim()}…`;
}

async function fetchSummaryPage(
  client: SupabaseClient<Database>,
  from: number,
  to: number,
  publishedOnly: boolean,
  select: string,
) {
  let query = client
    .from("articles")
    .select(select)
    .order("date", { ascending: false })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (publishedOnly) {
    query = query.eq("status", "Published");
  }

  let { data, error } = await query;
  if (error && select === adminSummarySelectColumns() && downgradeAdminSummarySelectOnError(error)) {
    return fetchSummaryPage(client, from, to, publishedOnly, adminSummarySelectColumns());
  }
  if (error) throw error;
  return (data ?? []).map((row) =>
    rowToSummaryArticle(row as unknown as ArticleRow),
  );
}

export type FetchPublishedSummariesOptions = {
  /** First paint — cap rows (single round-trip). */
  limit?: number;
  publishedOnly?: boolean;
  /** Public lists use a slimmer column set to reduce egress. */
  selectMode?: "public" | "admin";
  /** @deprecated Tags are always included in admin summaries. */
  includeTags?: boolean;
};

function selectColumnsForMode(mode: "public" | "admin") {
  return mode === "public"
    ? PUBLIC_ARTICLE_SUMMARY_SELECT
    : adminSummarySelectColumns();
}

/** Paginated summary fetch; optional parallel follow-up pages when uncapped. */
export async function fetchPublishedSummaries(
  client: SupabaseClient<Database>,
  options: FetchPublishedSummariesOptions = {},
): Promise<Article[]> {
  const publishedOnly = options.publishedOnly !== false;
  const selectMode = options.selectMode ?? "admin";
  const select = selectColumnsForMode(selectMode);

  if (options.limit != null && options.limit > 0) {
    let query = client
      .from("articles")
      .select(select)
      .order("date", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(options.limit);

    if (publishedOnly) query = query.eq("status", "Published");

    let { data, error } = await query;
    if (error && selectMode === "admin" && downgradeAdminSummarySelectOnError(error)) {
      return fetchPublishedSummaries(client, options);
    }
    if (error) throw error;
    return (data ?? []).map((row) =>
      rowToSummaryArticle(row as unknown as ArticleRow),
    );
  }

  const first = await fetchSummaryPage(client, 0, PAGE_SIZE - 1, publishedOnly, select);
  if (first.length < PAGE_SIZE) return first;

  const pageIndexes = Array.from({ length: MAX_PAGES - 1 }, (_, i) => i + 1);
  const chunks: number[][] = [];
  for (let i = 0; i < pageIndexes.length; i += 4) {
    chunks.push(pageIndexes.slice(i, i + 4));
  }

  const rest: Article[] = [];
  for (const chunk of chunks) {
    const batch = await Promise.all(
      chunk.map((page) => {
        const from = page * PAGE_SIZE;
        return fetchSummaryPage(
          client,
          from,
          from + PAGE_SIZE - 1,
          publishedOnly,
          select,
        );
      }),
    );
    let empty = false;
    for (const page of batch) {
      if (!page.length) {
        empty = true;
        break;
      }
      rest.push(...page);
      if (page.length < PAGE_SIZE) empty = true;
    }
    if (empty) break;
  }

  return [...first, ...rest];
}

/** Cap for the Opinion archive page — covers imported columns without loading the full news corpus. */
export const PUBLIC_OPINION_SUMMARY_LIMIT = 500;

/**
 * Published Opinion / Column summaries only (WordPress often tags these as
 * "Column, Sports", "Column, Opinion", etc.).
 */
export async function fetchPublishedOpinionSummaries(
  client: SupabaseClient<Database>,
  options: { limit?: number } = {},
): Promise<Article[]> {
  const limit = Math.min(
    Math.max(options.limit ?? PUBLIC_OPINION_SUMMARY_LIMIT, 1),
    PUBLIC_OPINION_SUMMARY_LIMIT,
  );
  const select = PUBLIC_ARTICLE_SUMMARY_SELECT;

  const { data, error } = await client
    .from("articles")
    .select(select)
    .eq("status", "Published")
    .or("category.ilike.%Opinion%,category.ilike.%Column%")
    .order("date", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? [])
    .map((row) => rowToSummaryArticle(row as unknown as ArticleRow))
    .filter((article) => {
      const cat = article.category.toLowerCase();
      return cat === "opinion" || cat === "column";
    });
}

/** Load specific articles by slug id (homepage Popular News, etc.). */
export async function fetchArticlesByIds(
  client: SupabaseClient<Database>,
  ids: readonly string[],
  options: { publishedOnly?: boolean } = {},
): Promise<Article[]> {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const publishedOnly = options.publishedOnly !== false;
  const selectMode = options.publishedOnly !== false ? "public" : "admin";
  const select = selectColumnsForMode(selectMode);

  let query = client
    .from("articles")
    .select(select)
    .in("id", uniqueIds);

  if (publishedOnly) query = query.eq("status", "Published");

  let { data, error } = await query;
  if (error && selectMode === "admin" && downgradeAdminSummarySelectOnError(error)) {
    return fetchArticlesByIds(client, ids, options);
  }
  if (error) throw error;

  const byId = new Map(
    (data ?? []).map((row) => {
      const partial = row as unknown as ArticleRow;
      const article = rowToSummaryArticle(partial);
      return [partial.id.toLowerCase(), article] as const;
    }),
  );

  return uniqueIds
    .map((id) => byId.get(id.toLowerCase()))
    .filter((article): article is Article => Boolean(article));
}
