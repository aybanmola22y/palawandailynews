import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { fetchPublishedOpinionSummaries } from "@/lib/articles/fetch-published-summaries";
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

const getCachedOpinionSummaries = unstable_cache(
  async () => {
    const client = getAnonServerClient();
    if (!client) throw new Error("Supabase client unavailable");
    return fetchPublishedOpinionSummaries(client);
  },
  ["public-opinion-summaries-v1"],
  { revalidate: 60, tags: ["article-summaries", "article-opinion"] },
);

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  try {
    const articles = await getCachedOpinionSummaries();
    return NextResponse.json(articles, {
      headers: {
        "Cache-Control": "public, s-maxage=60, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load opinion articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
