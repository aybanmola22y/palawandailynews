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

const DEFAULT_MEDIA_BASE = "https://palawandailynews.com";

/** Hostinger / site root for relative image paths (imports, featured images). */
export function getMediaBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim() || DEFAULT_MEDIA_BASE;
  return base.replace(/\/$/, "");
}

export const SUPABASE_NOT_CONFIGURED_MSG =
  "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env, then restart the dev server.";
