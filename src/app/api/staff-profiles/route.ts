import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchStaffProfilesFromSupabase } from "@/lib/staff/fetch-staff-profiles";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const revalidate = 1800;

const getCachedStaffProfiles = unstable_cache(
  async () => {
    const service = getSupabaseServiceClient();
    if (!service) {
      throw new Error("Supabase is not configured.");
    }
    return fetchStaffProfilesFromSupabase(service);
  },
  ["public-staff-profiles"],
  { revalidate: 1800, tags: ["staff-profiles"] },
);

export async function GET() {
  try {
    const staff = await getCachedStaffProfiles();
    return NextResponse.json(staff, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load staff";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
