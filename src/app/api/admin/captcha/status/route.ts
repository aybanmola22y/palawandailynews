import { NextResponse } from "next/server";
import { hasValidAdminCaptchaCookie } from "@/lib/security/admin-captcha";
import {
  getTurnstileSiteKey,
  isTurnstileConfigured,
} from "@/lib/security/turnstile";

export async function GET() {
  const required = isTurnstileConfigured();
  const passed = await hasValidAdminCaptchaCookie();

  return NextResponse.json({
    required,
    passed: required ? passed : true,
    siteKey: required ? getTurnstileSiteKey() : null,
  });
}
