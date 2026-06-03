import { NextRequest, NextResponse } from "next/server";
import {
  createAdminCaptchaToken,
  setAdminCaptchaCookie,
} from "@/lib/security/admin-captcha";
import {
  enforceAdminAuthRateLimit,
  getRequestClientIp,
  recordAdminAuthFailure,
  rateLimitResponse,
} from "@/lib/security/admin-auth-rate-limit";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/security/turnstile";

export async function POST(request: NextRequest) {
  if (!isTurnstileConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const rateLimited = await enforceAdminAuthRateLimit(request, ["captcha-ip"]);
  if (rateLimited) return rateLimited;

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  const verified = await verifyTurnstileToken(
    token,
    getRequestClientIp(request),
  );

  if (!verified.ok) {
    const locked = await recordAdminAuthFailure(request, "captcha-ip");
    if (!locked.allowed) return rateLimitResponse(locked.retryAfterSec);
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const captchaToken = await createAdminCaptchaToken();
  const response = NextResponse.json({ ok: true });
  setAdminCaptchaCookie(response, captchaToken);
  return response;
}
