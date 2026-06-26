import { NextResponse, type NextRequest } from "next/server";
import { scanRequestForSqlInjection } from "@/lib/security/sqli-guard";
import {
  DANGEROUS_PATH,
  hasDisallowedQueryKeys,
} from "@/lib/security/safe-url";

const PUBLIC_DATA_API_PATHS = [
  "/api/articles",
  "/api/authors/preview",
  "/api/staff-profiles",
  "/api/ads",
] as const;

const BOT_USER_AGENT =
  /(bot|crawler|spider|crawling|facebookexternalhit|twitterbot|slurp|bingpreview|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|yandex|baiduspider|duckduckbot)/i;

export function isBlockedRequest(request: NextRequest): boolean {
  const { pathname, search } = request.nextUrl;

  if (DANGEROUS_PATH.test(pathname) || pathname.includes("\0")) {
    return true;
  }

  try {
    const decoded = decodeURIComponent(pathname);
    if (DANGEROUS_PATH.test(decoded) || decoded.includes("\0")) {
      return true;
    }
  } catch {
    return true;
  }

  if (scanRequestForSqlInjection({ pathname, search: "" })) {
    return true;
  }

  const strictScan =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (strictScan && scanRequestForSqlInjection({ pathname, search })) {
    return true;
  }

  if (pathname.startsWith("/admin") && hasDisallowedQueryKeys(request.nextUrl.searchParams)) {
    return true;
  }

  return false;
}

export function isPublicDataApiPath(pathname: string): boolean {
  return PUBLIC_DATA_API_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isCrawlerRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") ?? "";
  return BOT_USER_AGENT.test(userAgent);
}

export function blockedRequestResponse(): NextResponse {
  return new NextResponse("Bad Request", { status: 400 });
}

export function crawlerBlockedResponse(): NextResponse {
  return NextResponse.json(
    { error: "Automated access to data APIs is disallowed." },
    {
      status: 403,
      headers: {
        "Cache-Control": "public, max-age=3600",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}

/** Validate dynamic route segment before database lookup. */
export function invalidIdResponse(label = "Invalid id"): NextResponse {
  return NextResponse.json({ error: label }, { status: 400 });
}

export function guardDynamicArticlePath(pathname: string): boolean {
  const match = pathname.match(/^\/article\/([^/]+)\/?$/);
  if (!match) return true;
  const id = match[1];
  try {
    return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,240}$/.test(decodeURIComponent(id));
  } catch {
    return false;
  }
}

export function guardDynamicAuthorPath(pathname: string): boolean {
  const match = pathname.match(/^\/author\/([^/]+)\/?$/);
  if (!match) return true;
  const slug = match[1];
  try {
    return /^[a-z0-9][a-z0-9-]{0,120}$/.test(decodeURIComponent(slug).toLowerCase());
  } catch {
    return false;
  }
}

export function isValidPublicDynamicRoute(pathname: string): boolean {
  return guardDynamicArticlePath(pathname) && guardDynamicAuthorPath(pathname);
}
