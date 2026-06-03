import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import { verifyAdminMfaCode } from "@/lib/admin-mfa";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import {
  enforceAdminAuthRateLimit,
  recordAdminAuthFailure,
  rateLimitResponse,
} from "@/lib/security/admin-auth-rate-limit";

export async function POST(request: NextRequest) {
  const auth = await requireAdminRouteAuth({ allowBeforeMfaEnrolled: true });
  if (auth instanceof NextResponse) return auth;

  let body: { code?: string; factorId?: string; challengeId?: string };
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
      { error: "Code, factorId, and challengeId are required." },
      { status: 400 },
    );
  }

  const rateLimited = await enforceAdminAuthRateLimit(request, ["mfa-enroll"]);
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase Auth is not available." },
      { status: 503 },
    );
  }

  const verified = await verifyAdminMfaCode(supabase, {
    code,
    factorId,
    challengeId,
  });
  if (!verified.ok) {
    const fail = await recordAdminAuthFailure(request, "mfa-enroll");
    if (!fail.allowed) return rateLimitResponse(fail.retryAfterSec);
    return NextResponse.json({ error: verified.message }, { status: 401 });
  }

  return NextResponse.json({ enrolled: true });
}
