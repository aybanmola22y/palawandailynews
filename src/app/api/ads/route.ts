import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchAdsFromSupabase } from "@/lib/ads/fetch-ads";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const revalidate = 1800;

const getCachedAds = unstable_cache(
  async () => {
    const service = getSupabaseServiceClient();
    if (!service) {
      throw new Error("Supabase is not configured.");
    }
    return fetchAdsFromSupabase(service);
  },
  ["public-ads"],
  { revalidate: 1800, tags: ["ads"] },
);

export async function GET() {
  try {
    const ads = await getCachedAds();
    return NextResponse.json(ads, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load ads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
