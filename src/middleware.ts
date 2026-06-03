import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";
import {
  blockedRequestResponse,
  isBlockedRequest,
  isValidPublicDynamicRoute,
} from "@/lib/security/request-guard";
import { updateAdminSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (isBlockedRequest(request)) {
    return applySecurityHeaders(blockedRequestResponse(), request);
  }

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") && !isValidPublicDynamicRoute(pathname)) {
    return applySecurityHeaders(blockedRequestResponse(), request);
  }

  const response = pathname.startsWith("/admin")
    ? await updateAdminSession(request)
    : NextResponse.next({ request });

  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: [
    /*
     * Skip all Next internals (chunks, HMR, images) and static files so dev
     * does not hit ChunkLoadError on stale or HMR-specific assets.
     */
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2)$).*)",
  ],
};
