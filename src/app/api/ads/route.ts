import { NextResponse } from "next/server";
import { fetchAdsFromSupabase } from "@/lib/ads/fetch-ads";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const service = getSupabaseServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  try {
    const ads = await fetchAdsFromSupabase(service);
    return NextResponse.json(ads, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load ads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
