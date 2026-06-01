import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

type CookieOptions = Record<string, unknown>;

/**
 * Supabase client for Route Handlers — writes auth cookies onto the response
 * (required for signInWithPassword sessions to persist in Next.js App Router).
 */
export function createSupabaseRouteHandlerClient(
  request: NextRequest,
  response: NextResponse,
) {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!isSupabaseConfigured() || !url || !key) {
    return null;
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[],
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

/** Copy Supabase auth cookies from a template response onto the final JSON response. */
export function mergeSupabaseCookies(
  from: NextResponse,
  to: NextResponse,
) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}
