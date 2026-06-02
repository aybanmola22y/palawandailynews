import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { fetchPublishedSummaries } from "@/lib/articles/fetch-published-summaries";
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

  try {
    const articles = await fetchPublishedSummaries(client, {
      publishedOnly: true,
    });

    return NextResponse.json(articles, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
