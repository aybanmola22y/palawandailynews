import { getSupabaseUrl } from "@/lib/supabase/env";

const TURNSTILE = "https://challenges.cloudflare.com";

function supabaseConnectOrigins(): string[] {
  const url = getSupabaseUrl();
  if (!url) return ["https://*.supabase.co"];

  try {
    const parsed = new URL(url);
    const origins = [parsed.origin, "https://*.supabase.co"];
    if (parsed.protocol === "https:") {
      origins.push(`wss://${parsed.host}`);
    }
    return origins;
  } catch {
    return ["https://*.supabase.co"];
  }
}

/** Shared CSP for middleware + next.config headers. */
export function buildContentSecurityPolicy(): string {
  const base =
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
  const supabase = supabaseConnectOrigins().join(" ");
  const connectBase = `'self' ${supabase} ${TURNSTILE}`;

  if (process.env.NODE_ENV === "development") {
    return `${base}; script-src 'self' 'unsafe-eval' 'unsafe-inline' ${TURNSTILE}; frame-src 'self' ${TURNSTILE}; connect-src ${connectBase} ws: wss:`;
  }

  return `${base}; script-src 'self' 'unsafe-inline' ${TURNSTILE}; frame-src 'self' ${TURNSTILE}; connect-src ${connectBase}`;
}
