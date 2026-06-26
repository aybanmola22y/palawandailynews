import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getAuthorRawCandidates } from "@/lib/author-resolve";
import {
  ARTICLE_SUMMARY_SELECT,
} from "@/lib/articles/fetch-published-summaries";
import { rowToArticle } from "@/lib/articles/map-article-row";
import type { ArticleRow } from "@/lib/supabase/database.types";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

export const revalidate = 600;

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

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
      { preview: [], totalCount: 0 },
      { status: 200 },
    );
  }

  const client = getAnonServerClient();
  if (!client) {
    return NextResponse.json(
      { error: "Supabase client unavailable" },
      { status: 503 },
    );
  }

  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  const includeDrafts =
    request.nextUrl.searchParams.get("drafts") === "1" ||
    request.nextUrl.searchParams.get("drafts") === "true";
  const limitRaw = Number.parseInt(
    request.nextUrl.searchParams.get("limit") ?? String(DEFAULT_LIMIT),
    10,
  );
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const rawCandidates = getAuthorRawCandidates(name);
  if (!name || rawCandidates.length === 0) {
    return NextResponse.json({ preview: [], totalCount: 0 });
  }

  try {
    let query = client
      .from("articles")
      .select(ARTICLE_SUMMARY_SELECT, { count: "exact" })
      .in("author", rawCandidates)
      .order("date", { ascending: false })
      .limit(limit);

    if (!includeDrafts) {
      query = query.eq("status", "Published");
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const preview = (data ?? []).map((row) =>
      rowToArticle(row as ArticleRow),
    );

    return NextResponse.json(
      { preview, totalCount: count ?? preview.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load author preview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
