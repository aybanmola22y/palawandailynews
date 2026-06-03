import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

/** Anti-clickjacking, MIME sniffing, and baseline hardening on every response. */
export function applySecurityHeaders(
  response: NextResponse,
  request?: NextRequest,
): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");

  const isHttps =
    request?.nextUrl.protocol === "https:" ||
    request?.headers.get("x-forwarded-proto") === "https";

  if (process.env.NODE_ENV === "production" && isHttps) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  return response;
}
