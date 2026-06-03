import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { fetchArticlesByIds } from "@/lib/articles/fetch-published-summaries";
import { POPULAR_NEWS_ARTICLE_IDS } from "@/data/popular-news";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

function getAnonServerClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([], { status: 200 });
  }

  const client = getAnonServerClient();
  if (!client) {
    return NextResponse.json(
      { error: "Supabase client unavailable" },
      { status: 503 },
    );
  }

  try {
    const articles = await fetchArticlesByIds(client, POPULAR_NEWS_ARTICLE_IDS, {
      publishedOnly: true,
    });
    return NextResponse.json(articles, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load popular articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
