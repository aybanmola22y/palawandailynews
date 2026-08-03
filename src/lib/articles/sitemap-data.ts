import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

export const ARTICLES_PER_SITEMAP = 1000;
export const MAX_ARTICLE_SITEMAPS = 30;

type SitemapArticleRow = {
  id: string;
  date: string | null;
  updated_at: string | null;
};

function getAnonServerClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getCachedPublishedArticleCount = unstable_cache(
  async (): Promise<number> => {
    if (!isSupabaseConfigured()) return 0;
    const client = getAnonServerClient();
    if (!client) return 0;

    const { count, error } = await client
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "Published");

    if (error) return 0;
    return count ?? 0;
  },
  ["sitemap-published-count-v1"],
  { revalidate: 3600, tags: ["article-summaries", "sitemap"] },
);

export const getCachedArticleSitemapPage = unstable_cache(
  async (page: number): Promise<SitemapArticleRow[]> => {
    if (!isSupabaseConfigured()) return [];
    const client = getAnonServerClient();
    if (!client) return [];

    const from = page * ARTICLES_PER_SITEMAP;
    const to = from + ARTICLES_PER_SITEMAP - 1;

    const { data, error } = await client
      .from("articles")
      .select("id, date, updated_at")
      .eq("status", "Published")
      .order("date", { ascending: false })
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error || !data) return [];
    return data as SitemapArticleRow[];
  },
  ["sitemap-article-page-v1"],
  { revalidate: 3600, tags: ["article-summaries", "sitemap"] },
);

export function articleSitemapPageCount(totalArticles: number): number {
  if (totalArticles <= 0) return 0;
  return Math.min(
    Math.ceil(totalArticles / ARTICLES_PER_SITEMAP),
    MAX_ARTICLE_SITEMAPS,
  );
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function sitemapXmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
