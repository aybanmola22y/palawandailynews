import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { fetchPublishedSummaries } from "@/lib/articles/fetch-published-summaries";
import { PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT } from "@/lib/articles/load-public-summaries";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

/** Short ISR window — admin publish also calls revalidateTag. */
export const revalidate = 60;

function getAnonServerClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseLimitParam(raw: string | null): number {
  if (!raw) return PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT;
  return Math.min(n, PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT);
}

const getCachedPublicSummaries = unstable_cache(
  async (limit: number) => {
    const client = getAnonServerClient();
    if (!client) {
      throw new Error("Supabase client unavailable");
    }
    return fetchPublishedSummaries(client, {
      publishedOnly: true,
      limit,
      selectMode: "public",
    });
  },
  ["public-article-summaries-v2"],
  { revalidate: 60, tags: ["article-summaries"] },
);

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const limit = parseLimitParam(request.nextUrl.searchParams.get("limit"));

  try {
    const articles = await getCachedPublicSummaries(limit);

    return NextResponse.json(articles, {
      headers: {
        // Do not use long stale-while-revalidate — publishing from localhost
        // cannot purge every CDN edge, and readers were stuck on old lists.
        "Cache-Control": "public, s-maxage=60, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
