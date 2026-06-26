import { NextResponse } from "next/server";
import { fetchStaffProfilesFromSupabase } from "@/lib/staff/fetch-staff-profiles";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const revalidate = 600;

export async function GET() {
  const service = getSupabaseServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  try {
    const staff = await fetchStaffProfilesFromSupabase(service);
    return NextResponse.json(staff, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load staff";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
