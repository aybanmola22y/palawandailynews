import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

export async function createServerSupabaseClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!isSupabaseConfigured() || !url || !key) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* setAll from Server Component — middleware handles refresh */
        }
      },
    },
  });
}
