import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseUrl, isSupabaseServiceConfigured } from "@/lib/supabase/env";

/** Service-role client for scripts and server routes (bulk import). */
export function getSupabaseServiceClient(): SupabaseClient<Database> | null {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!isSupabaseServiceConfigured() || !url || !key) return null;

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
