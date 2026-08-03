import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  PUBLIC_SEARCH_MAX_PAGE,
  PUBLIC_SEARCH_MIN_QUERY,
  PUBLIC_SEARCH_PAGE_SIZE,
  sanitizeArchiveSearchQuery,
  searchPublishedSummaries,
} from "@/lib/articles/search-published-summaries";
import { clampInt } from "@/lib/security/safe-url";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

/** Short CDN cache for identical q+page — cuts repeat Supabase hits. */
export const revalidate = 60;

function getAnonServerClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const sp = request.nextUrl.searchParams;
  const query = sanitizeArchiveSearchQuery(sp.get("q") ?? "");
  const page = clampInt(sp.get("page"), 1, PUBLIC_SEARCH_MAX_PAGE, 1);
  const pageSize = clampInt(
    sp.get("limit"),
    1,
    PUBLIC_SEARCH_PAGE_SIZE,
    PUBLIC_SEARCH_PAGE_SIZE,
  );

  if (query.length < PUBLIC_SEARCH_MIN_QUERY) {
    return NextResponse.json(
      {
        articles: [],
        page: 1,
        pageSize,
        total: 0,
        totalPages: 1,
        hasMore: false,
        query: "",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, max-age=0, must-revalidate",
        },
      },
    );
  }

  const client = getAnonServerClient();
  if (!client) {
    return NextResponse.json(
      { error: "Supabase client unavailable" },
      { status: 503 },
    );
  }

  try {
    const result = await searchPublishedSummaries(client, {
      query,
      page,
      pageSize,
    });

    return NextResponse.json(
      { ...result, query },
      {
        headers: {
          // Identical searches reuse CDN for a minute — fewer free-tier DB round-trips.
          "Cache-Control": "public, s-maxage=60, max-age=0, must-revalidate",
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
