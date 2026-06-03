import { NextRequest, NextResponse } from "next/server";
import {
  fetchAdminProfileForAuthUser,
  useSupabaseAdminAuth,
} from "@/lib/admin-auth";
import { verifyAdminMfaCode } from "@/lib/admin-mfa";
import {
  createSupabaseRouteHandlerClient,
  mergeSupabaseCookies,
} from "@/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  if (!useSupabaseAdminAuth()) {
    return NextResponse.json(
      { error: "Two-factor authentication requires Supabase Auth." },
      { status: 503 },
    );
  }

  let body: {
    code?: string;
    factorId?: string;
    challengeId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const code = body.code?.trim() ?? "";
  const factorId = body.factorId?.trim() ?? "";
  const challengeId = body.challengeId?.trim() ?? "";

  if (!code || !factorId || !challengeId) {
    return NextResponse.json(
      { error: "Verification code is required." },
      { status: 400 },
    );
  }

  const cookieResponse = new NextResponse(null, { status: 200 });
  const supabase = createSupabaseRouteHandlerClient(request, cookieResponse);
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Session expired. Sign in with your password again." },
      { status: 401 },
    );
  }

  const verified = await verifyAdminMfaCode(supabase, {
    code,
    factorId,
    challengeId,
  });
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 401 });
  }

  const profile = await fetchAdminProfileForAuthUser(supabase, user);
  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const jsonResponse = NextResponse.json({ user: profile });
  mergeSupabaseCookies(cookieResponse, jsonResponse);
  return jsonResponse;
}
