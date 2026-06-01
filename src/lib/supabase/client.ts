import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!isSupabaseConfigured() || !url || !key) return null;

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url, key);
  }

  return browserClient;
}
