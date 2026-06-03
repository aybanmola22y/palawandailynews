import { NextRequest, NextResponse } from "next/server";
import { useSupabaseAdminAuth } from "@/lib/admin-auth";
import {
  adminNeedsMfaChallenge,
  startAdminMfaChallenge,
} from "@/lib/admin-mfa";
import {
  createSupabaseRouteHandlerClient,
  mergeSupabaseCookies,
} from "@/lib/supabase/route-handler";

/** Start (or refresh) a TOTP challenge for an existing AAL1 session. */
export async function POST(request: NextRequest) {
  if (!useSupabaseAdminAuth()) {
    return NextResponse.json(
      { error: "Two-factor authentication requires Supabase Auth." },
      { status: 503 },
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

  const needsMfa = await adminNeedsMfaChallenge(supabase);
  if (!needsMfa) {
    return NextResponse.json(
      { error: "Two-factor verification is not required for this session." },
      { status: 400 },
    );
  }

  const challenge = await startAdminMfaChallenge(supabase);
  if (!challenge) {
    return NextResponse.json(
      { error: "Could not start authenticator verification." },
      { status: 503 },
    );
  }

  const jsonResponse = NextResponse.json({
    mfaRequired: true,
    ...challenge,
  });
  mergeSupabaseCookies(cookieResponse, jsonResponse);
  return jsonResponse;
}
