import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  enforceAdminAuthRateLimit,
  recordAdminAuthFailure,
  rateLimitResponse,
} from "@/lib/security/admin-auth-rate-limit";

/**
 * One-time / dev helper: set a Supabase Auth password when you know ADMIN_SETUP_SECRET.
 * Add ADMIN_SETUP_SECRET=... to .env (do not commit). Remove after onboarding.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const expectedSecret = process.env.ADMIN_SETUP_SECRET?.trim();
  if (!expectedSecret) {
    return NextResponse.json(
      {
        error:
          "Password setup is disabled. Add ADMIN_SETUP_SECRET to .env or run: npm run seed-admin-auth -- email NewPassword",
      },
      { status: 503 },
    );
  }

  let body: { email?: string; password?: string; secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password?.trim() ?? "";
  const secret = body.secret?.trim() ?? "";

  if (!email || !password || !secret) {
    return NextResponse.json(
      { error: "Email, new password, and setup key are required." },
      { status: 400 },
    );
  }

  const rateLimited = await enforceAdminAuthRateLimit(request, [
    "setup-password-ip",
  ]);
  if (rateLimited) return rateLimited;

  if (secret !== expectedSecret) {
    const locked = await recordAdminAuthFailure(request, "setup-password-ip");
    if (!locked.allowed) return rateLimitResponse(locked.retryAfterSec);
    return NextResponse.json({ error: "Invalid setup key." }, { status: 403 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const service = getSupabaseServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Service role key is missing from .env" },
      { status: 503 },
    );
  }

  const { data: listData } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const authUser = listData?.users?.find(
    (u) => u.email?.trim().toLowerCase() === email,
  );

  if (!authUser) {
    return NextResponse.json(
      {
        error:
          "No Supabase Auth user for this email. Create the user in Dashboard → Authentication first.",
      },
      { status: 404 },
    );
  }

  const { error: updateError } = await service.auth.admin.updateUserById(
    authUser.id,
    { password },
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Password updated. You can sign in with your new password now.",
  });
}
