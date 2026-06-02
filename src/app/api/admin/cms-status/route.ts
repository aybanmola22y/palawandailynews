import { NextResponse } from "next/server";
import {
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/env";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const service = getSupabaseServiceClient();
  return NextResponse.json({
    supabaseConfigured: isSupabaseConfigured(),
    serviceRoleConfigured: isSupabaseServiceConfigured(),
    canWriteArticles: Boolean(service),
  });
}
