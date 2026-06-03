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
  adminMustEnrollMfa,
  adminNeedsMfaChallenge,
  startAdminMfaChallenge,
} from "@/lib/admin-mfa";
import {
  createSupabaseRouteHandlerClient,
  mergeSupabaseCookies,
} from "@/lib/supabase/route-handler";
import { requireAdminCaptchaPass } from "@/lib/security/admin-captcha";
import {
  clearAdminAuthRateLimits,
  enforceAdminAuthRateLimit,
  recordAdminLoginFailures,
} from "@/lib/security/admin-auth-rate-limit";

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

  const captchaBlocked = await requireAdminCaptchaPass(request);
  if (captchaBlocked) return captchaBlocked;

  const rateLimited = await enforceAdminAuthRateLimit(
    request,
    ["login-ip", "login-email"],
    email,
  );
  if (rateLimited) return rateLimited;

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
      const locked = await recordAdminLoginFailures(request, email);
      if (locked) return locked;
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

    await clearAdminAuthRateLimits(request, email);

    if (await adminMustEnrollMfa(supabase)) {
      const jsonResponse = NextResponse.json({ enrollmentRequired: true });
      mergeSupabaseCookies(cookieResponse, jsonResponse);
      return jsonResponse;
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
    const locked = await recordAdminLoginFailures(request, email);
    if (locked) return locked;
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const profile = resolveAdminProfileFromSeed(email);
  const token = await createLegacySessionToken(profile);

  await clearAdminAuthRateLimits(request, email);
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
