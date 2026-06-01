import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, useSupabaseAdminAuth } from "@/lib/admin-auth";
import {
  createSupabaseRouteHandlerClient,
  mergeSupabaseCookies,
} from "@/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  const cookieResponse = new NextResponse(null, { status: 200 });
  const response = NextResponse.json({ ok: true });

  if (useSupabaseAdminAuth()) {
    const supabase = createSupabaseRouteHandlerClient(request, cookieResponse);
    if (supabase) {
      await supabase.auth.signOut();
    }
    mergeSupabaseCookies(cookieResponse, response);
  }

  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
