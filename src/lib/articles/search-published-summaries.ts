import type { SupabaseClient } from "@supabase/supabase-js";
import type { Article } from "@/types/article";
import type { ArticleRow, Database } from "@/lib/supabase/database.types";
import { getAuthorRawCandidates } from "@/lib/author-resolve";
import { rowToArticle } from "@/lib/articles/map-article-row";
import authorConfig from "@/data/author-aliases.json";
import {
  PUBLIC_SEARCH_MAX_PAGE,
  PUBLIC_SEARCH_MIN_QUERY,
  PUBLIC_SEARCH_PAGE_SIZE,
  sanitizeArchiveSearchQuery,
  type PublishedSearchResult,
} from "@/lib/articles/search-published-shared";

export type { PublishedSearchResult };
export {
  PUBLIC_SEARCH_MAX_PAGE,
  PUBLIC_SEARCH_MIN_QUERY,
  PUBLIC_SEARCH_PAGE_SIZE,
  sanitizeArchiveSearchQuery,
} from "@/lib/articles/search-published-shared";

/**
 * Lean columns for archive search — no excerpt/content HTML.
 * Keeps free-tier Supabase egress small (title + meta + image URL only).
 */
const SEARCH_SUMMARY_SELECT =
  "id, title, category, author, date, reading_time, image_url, is_breaking, updated_at";

/** Cap OR clauses so the PostgREST filter stays small. */
const MAX_AUTHOR_VARIANTS = 12;

function rowToSearchArticle(row: ArticleRow): Article {
  return rowToArticle({
    ...row,
    excerpt: "",
    content: "",
    tags: [],
    status: "Published",
  });
}

function quoteFilterValue(value: string): string {
  return `"${value.replace(/"/g, "")}"`;
}

/**
 * Expand a search term into raw `articles.author` values (WP logins / emails /
 * aliases) so archive search finds stories whose byline was stored pre-resolve.
 */
function authorSearchVariants(query: string): string[] {
  const q = query.toLowerCase();
  const values = new Set<string>();

  for (const c of getAuthorRawCandidates(query)) {
    const cleaned = sanitizeArchiveSearchQuery(c);
    if (cleaned.length >= PUBLIC_SEARCH_MIN_QUERY) values.add(cleaned);
    // Emails/logins may include @ . _ which sanitize strips — keep originals too.
    if (c.trim().length >= PUBLIC_SEARCH_MIN_QUERY) values.add(c.trim());
  }

  for (const [aliasKey, aliasValue] of Object.entries(authorConfig.aliases)) {
    if (
      aliasValue.toLowerCase().includes(q) ||
      aliasKey.toLowerCase().includes(q)
    ) {
      values.add(aliasKey);
      values.add(aliasValue);
      for (const c of getAuthorRawCandidates(aliasValue)) {
        values.add(c);
      }
    }
  }

  return [...values]
    .map((v) => v.trim())
    .filter((v) => v.length >= PUBLIC_SEARCH_MIN_QUERY)
    .slice(0, MAX_AUTHOR_VARIANTS);
}

function buildSearchOrFilter(query: string): string {
  const parts: string[] = [
    `title.ilike.${quoteFilterValue(`%${query}%`)}`,
    `category.ilike.${quoteFilterValue(`%${query}%`)}`,
    `author.ilike.${quoteFilterValue(`%${query}%`)}`,
  ];

  for (const variant of authorSearchVariants(query)) {
    parts.push(`author.eq.${quoteFilterValue(variant)}`);
    if (variant.toLowerCase() !== query.toLowerCase()) {
      parts.push(`author.ilike.${quoteFilterValue(`%${variant}%`)}`);
    }
  }

  return [...new Set(parts)].join(",");
}

/**
 * Server-side archive search against published articles only.
 * Returns one small page of summaries — never the full table.
 */
export async function searchPublishedSummaries(
  client: SupabaseClient<Database>,
  options: { query: string; page?: number; pageSize?: number },
): Promise<PublishedSearchResult> {
  const query = sanitizeArchiveSearchQuery(options.query);
  const pageSize = Math.min(
    Math.max(options.pageSize ?? PUBLIC_SEARCH_PAGE_SIZE, 1),
    PUBLIC_SEARCH_PAGE_SIZE,
  );
  const page = Math.min(
    Math.max(options.page ?? 1, 1),
    PUBLIC_SEARCH_MAX_PAGE,
  );

  if (query.length < PUBLIC_SEARCH_MIN_QUERY) {
    return {
      articles: [],
      page: 1,
      pageSize,
      total: 0,
      totalPages: 1,
      hasMore: false,
    };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await client
    .from("articles")
    .select(SEARCH_SUMMARY_SELECT, { count: "exact" })
    .eq("status", "Published")
    .or(buildSearchOrFilter(query))
    .order("date", { ascending: false })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.min(
    Math.max(1, Math.ceil(total / pageSize)),
    PUBLIC_SEARCH_MAX_PAGE,
  );
  const articles = (data ?? []).map((row) =>
    rowToSearchArticle(row as unknown as ArticleRow),
  );

  return {
    articles,
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}
