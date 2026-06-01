import type { SupabaseClient } from "@supabase/supabase-js";
import type { Article } from "@/types/article";
import type { ArticleRow } from "@/lib/supabase/database.types";
import { rowToArticle } from "@/lib/articles/map-article-row";
import type { Database } from "@/lib/supabase/database.types";

export const ARTICLE_SUMMARY_SELECT =
  "id, title, excerpt, category, author, date, reading_time, image_url, is_breaking, status, updated_at, legacy_wp_id";

const PAGE_SIZE = 1000;
const MAX_PAGES = 30;
const LIST_EXCERPT_MAX = 280;

function trimListExcerpt(excerpt: string) {
  const t = excerpt.trim();
  if (t.length <= LIST_EXCERPT_MAX) return t;
  return `${t.slice(0, LIST_EXCERPT_MAX).trim()}…`;
}

function rowToSummaryArticle(row: ArticleRow): Article {
  const article = rowToArticle({
    ...row,
    excerpt: trimListExcerpt(row.excerpt ?? ""),
    content: "",
    tags: [],
  });
  return article;
}

async function fetchSummaryPage(
  client: SupabaseClient<Database>,
  from: number,
  to: number,
  publishedOnly: boolean,
) {
  let query = client
    .from("articles")
    .select(ARTICLE_SUMMARY_SELECT)
    .order("date", { ascending: false })
    .range(from, to);

  if (publishedOnly) {
    query = query.eq("status", "Published");
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) =>
    rowToSummaryArticle(row as unknown as ArticleRow),
  );
}

export type FetchPublishedSummariesOptions = {
  /** First paint — cap rows (single round-trip). */
  limit?: number;
  publishedOnly?: boolean;
};

/** Paginated summary fetch; optional parallel follow-up pages when uncapped. */
export async function fetchPublishedSummaries(
  client: SupabaseClient<Database>,
  options: FetchPublishedSummariesOptions = {},
): Promise<Article[]> {
  const publishedOnly = options.publishedOnly !== false;

  if (options.limit != null && options.limit > 0) {
    let query = client
      .from("articles")
      .select(ARTICLE_SUMMARY_SELECT)
      .order("date", { ascending: false })
      .limit(options.limit);

    if (publishedOnly) query = query.eq("status", "Published");

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) =>
      rowToSummaryArticle(row as unknown as ArticleRow),
    );
  }

  const first = await fetchSummaryPage(client, 0, PAGE_SIZE - 1, publishedOnly);
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
        return fetchSummaryPage(client, from, from + PAGE_SIZE - 1, publishedOnly);
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
