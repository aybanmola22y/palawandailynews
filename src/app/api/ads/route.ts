import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchAdsFromSupabase } from "@/lib/ads/fetch-ads";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const revalidate = 60;

const getCachedAds = unstable_cache(
  async () => {
    const service = getSupabaseServiceClient();
    if (!service) {
      throw new Error("Supabase is not configured.");
    }
    return fetchAdsFromSupabase(service);
  },
  ["public-ads-v2"],
  { revalidate: 60, tags: ["ads"] },
);

export async function GET() {
  try {
    const ads = await getCachedAds();
    return NextResponse.json(ads, {
      headers: {
        "Cache-Control": "public, s-maxage=60, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load ads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
