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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2)$).*)",
  ],
};
