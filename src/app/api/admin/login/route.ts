import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
  createLegacySessionToken,
  credentialsAreValid,
  diagnoseAdminLoginFailure,
  fetchAdminProfileForAuthUser,
  resolveAdminProfileFromSeed,
  useSupabaseAdminAuth,
} from "@/lib/admin-auth";
import {
  adminNeedsMfaChallenge,
  startAdminMfaChallenge,
} from "@/lib/admin-mfa";
import {
  createSupabaseRouteHandlerClient,
  mergeSupabaseCookies,
} from "@/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password?.trim() ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  if (useSupabaseAdminAuth()) {
    const cookieResponse = new NextResponse(null, { status: 200 });
    const supabase = createSupabaseRouteHandlerClient(request, cookieResponse);
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 503 },
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const hint = await diagnoseAdminLoginFailure(email);
      return NextResponse.json(
        { error: hint.message },
        { status: hint.status },
      );
    }

    const profile = await fetchAdminProfileForAuthUser(supabase, data.user);
    if (!profile) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error:
            "Could not create your admin profile. Run migration 009 in Supabase SQL Editor, or contact a Super Admin.",
        },
        { status: 503 },
      );
    }

    const needsMfa = await adminNeedsMfaChallenge(supabase);
    if (needsMfa) {
      const challenge = await startAdminMfaChallenge(supabase);
      if (!challenge) {
        return NextResponse.json(
          {
            error:
              "Two-factor authentication is enabled but could not be started. Try again or contact support.",
          },
          { status: 503 },
        );
      }

      const jsonResponse = NextResponse.json({
        mfaRequired: true,
        factorId: challenge.factorId,
        challengeId: challenge.challengeId,
      });
      mergeSupabaseCookies(cookieResponse, jsonResponse);
      return jsonResponse;
    }

    const jsonResponse = NextResponse.json({ user: profile });
    mergeSupabaseCookies(cookieResponse, jsonResponse);
    return jsonResponse;
  }

  if (!credentialsAreValid(email, password)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const profile = resolveAdminProfileFromSeed(email);
  const token = await createLegacySessionToken(profile);

  const response = NextResponse.json({ user: profile });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  });

  return response;
}
