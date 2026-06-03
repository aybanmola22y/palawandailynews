import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ad } from "@/store/ads-context";
import type { Database } from "@/lib/supabase/database.types";
import { rowToAd } from "@/lib/ads/map-ad-row";
import type { AdRow } from "@/lib/supabase/database.types";

export async function fetchAdsFromSupabase(
  client: SupabaseClient<Database>,
): Promise<Ad[]> {
  const { data, error } = await client
    .from("ads")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => rowToAd(row as AdRow));
}
