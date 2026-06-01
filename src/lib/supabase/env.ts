export function getSupabaseUrl(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    null
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
}

export function isSupabaseServiceConfigured(): boolean {
  return Boolean(getSupabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/** Optional Hostinger/CDN prefix for relative image paths in imports. */
export function getMediaBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();
  return base ? base.replace(/\/$/, "") : null;
}

export const SUPABASE_NOT_CONFIGURED_MSG =
  "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env, then restart the dev server.";
