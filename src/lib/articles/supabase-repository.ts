import type { Article, ArticleInsert, ArticleUpdate } from "@/types/article";
import type { ArticlesRepository } from "@/lib/articles/repository";
import type { ArticleRow, ArticleUpdateRow } from "@/lib/supabase/database.types";
import {
  articleToRow,
  resolveImageUrl,
  rowToArticle,
} from "@/lib/articles/map-article-row";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ARTICLE_SUMMARY_SELECT,
  fetchPublishedSummaries,
} from "@/lib/articles/fetch-published-summaries";

function clientOrThrow() {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return client;
}

async function fetchArticlePagesFull(): Promise<Article[]> {
  const client = clientOrThrow();
  const pageSize = 1000;
  const out: Article[] = [];

  for (let from = 0; from < 100_000; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await client
      .from("articles")
      .select("*")
      .order("date", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const page = (data ?? []).map((row) => rowToArticle(row));
    out.push(...page);

    if (!data || data.length < pageSize) break;
  }

  return out;
}

export const supabaseArticlesRepository: ArticlesRepository = {
  async listSummaries() {
    return fetchPublishedSummaries(clientOrThrow(), { publishedOnly: true });
  },

  async list() {
    return fetchArticlePagesFull();
  },

  async getById(id) {
    const { data, error } = await clientOrThrow()
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? rowToArticle(data) : null;
  },

  async listByIds(ids) {
    const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) return [];

    const { data, error } = await clientOrThrow()
      .from("articles")
      .select(ARTICLE_SUMMARY_SELECT)
      .in("id", uniqueIds);

    if (error) throw error;

    const byId = new Map(
      (data ?? []).map((row) => {
        const partial = row as unknown as ArticleRow;
        return [
          partial.id.toLowerCase(),
          rowToArticle({ ...partial, content: "", tags: [] }),
        ] as const;
      }),
    );

    return uniqueIds
      .map((id) => byId.get(id.toLowerCase()))
      .filter((article): article is Article => Boolean(article));
  },

  async create(article) {
    const id = article.id?.trim() || String(Date.now());
    const row = articleToRow({
      ...article,
      id,
      updatedAt: Date.now(),
    });

    // If the tags migration hasn't been applied yet, retry without `tags`.
    const client = clientOrThrow();
    let { data, error } = await client
      .from("articles")
      .insert(row as any)
      .select()
      .single();

    if (
      error &&
      typeof (error as any).message === "string" &&
      (error as any).message.includes('column "tags"')
    ) {
      const { tags, ...rowWithoutTags } = row as any;
      ({ data, error } = await client
        .from("articles")
        .insert(rowWithoutTags)
        .select()
        .single());
    }

    if (error) throw error;
    if (!data) throw new Error("Failed to create article");
    return rowToArticle(data);
  },

  async update(id, changes) {
    const patch: ArticleUpdateRow = { updated_at: new Date().toISOString() };

    if (changes.title !== undefined) patch.title = changes.title;
    if (changes.excerpt !== undefined) patch.excerpt = changes.excerpt;
    if (changes.content !== undefined) patch.content = changes.content;
    if (changes.category !== undefined) patch.category = changes.category;
    if (changes.author !== undefined) patch.author = changes.author;
    if (changes.tags !== undefined) patch.tags = changes.tags as any;
    if (changes.date !== undefined) patch.date = changes.date;
    if (changes.readingTime !== undefined) patch.reading_time = changes.readingTime;
    if (changes.image !== undefined) patch.image_url = resolveImageUrl(changes.image);
    if (changes.isBreaking !== undefined) patch.is_breaking = changes.isBreaking;
    if (changes.status !== undefined) patch.status = changes.status;
    if (changes.legacyWpId !== undefined) patch.legacy_wp_id = changes.legacyWpId ?? null;

    const client = clientOrThrow();
    let { data, error } = await client
      .from("articles")
      .update(patch as any)
      .eq("id", id)
      .select()
      .single();

    if (
      error &&
      typeof (error as any).message === "string" &&
      (error as any).message.includes('column "tags"')
    ) {
      const { tags, ...patchWithoutTags } = patch as any;
      ({ data, error } = await client
        .from("articles")
        .update(patchWithoutTags)
        .eq("id", id)
        .select()
        .single());
    }

    if (error) throw error;
    if (!data) throw new Error("Failed to update article");
    return rowToArticle(data);
  },

  async delete(id) {
    const { error } = await clientOrThrow().from("articles").delete().eq("id", id);
    if (error) throw error;
  },
};
