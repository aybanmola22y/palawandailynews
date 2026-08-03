import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { fetchPublishedSummariesByAuthor } from "@/lib/articles/fetch-published-summaries";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

export const revalidate = 60;

function getAnonServerClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const getCachedAuthorSummaries = unstable_cache(
  async (authorName: string) => {
    const client = getAnonServerClient();
    if (!client) throw new Error("Supabase client unavailable");
    return fetchPublishedSummariesByAuthor(client, authorName);
  },
  ["public-author-summaries-v1"],
  { revalidate: 60, tags: ["article-summaries", "article-by-author"] },
);

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (!name || name.length > 160) {
    return NextResponse.json(
      { error: "Author name is required" },
      { status: 400 },
    );
  }

  try {
    const articles = await getCachedAuthorSummaries(name);
    return NextResponse.json(articles, {
      headers: {
        "Cache-Control": "public, s-maxage=60, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load author articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
