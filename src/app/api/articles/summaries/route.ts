import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { fetchPublishedSummaries } from "@/lib/articles/fetch-published-summaries";
import { PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT } from "@/lib/articles/load-public-summaries";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

/** CDN cache — revalidated on CMS publish via revalidatePath. */
export const revalidate = 900;

function getAnonServerClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseLimitParam(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(n, PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT);
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const client = getAnonServerClient();
  if (!client) {
    return NextResponse.json(
      { error: "Supabase client unavailable" },
      { status: 503 },
    );
  }

  const limit = parseLimitParam(request.nextUrl.searchParams.get("limit"));

  try {
    const articles = await fetchPublishedSummaries(client, {
      publishedOnly: true,
      limit,
    });

    const cacheControl =
      limit != null
        ? "public, s-maxage=600, stale-while-revalidate=3600"
        : "public, s-maxage=900, stale-while-revalidate=7200";

    return NextResponse.json(articles, {
      headers: {
        "Cache-Control": cacheControl,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
