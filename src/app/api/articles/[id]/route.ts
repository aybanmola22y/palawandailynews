import { NextRequest, NextResponse } from "next/server";
import { rowToArticle } from "@/lib/articles/map-article-row";
import type { ArticleRow } from "@/lib/supabase/database.types";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";
import { isValidArticleId } from "@/lib/security/safe-url";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const revalidate = 600;

function getAnonServerClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = rawId?.trim() ?? "";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  if (!isValidArticleId(id)) {
    return NextResponse.json({ error: "Invalid article id" }, { status: 400 });
  }

  const client = getSupabaseServiceClient() ?? getAnonServerClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase client unavailable" }, { status: 503 });
  }

  try {
    const { data, error } = await client
      .from("articles")
      .select("*")
      .eq("id", id)
      .eq("status", "Published")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(rowToArticle(data as ArticleRow), {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
