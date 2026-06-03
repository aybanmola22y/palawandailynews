import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  fromBase64Url,
  hmacSign,
  hmacVerify,
  toBase64Url,
} from "@/lib/security/signed-token";
import { isTurnstileConfigured } from "@/lib/security/turnstile";

export const ADMIN_CAPTCHA_COOKIE = "pdn_admin_captcha";
export const ADMIN_CAPTCHA_MAX_AGE_SEC = 20 * 60;

type CaptchaPayload = { exp: number };

export async function createAdminCaptchaToken(): Promise<string> {
  const payload: CaptchaPayload = {
    exp: Date.now() + ADMIN_CAPTCHA_MAX_AGE_SEC * 1000,
  };
  const body = toBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = await hmacSign(body);
  return `${body}.${signature}`;
}

export async function verifyAdminCaptchaToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token?.includes(".")) return false;

  const [body, signature] = token.split(".");
  if (!body || !signature) return false;
  if (!(await hmacVerify(body, signature))) return false;

  try {
    const json = new TextDecoder().decode(fromBase64Url(body));
    const payload = JSON.parse(json) as CaptchaPayload;
    return Boolean(payload.exp && payload.exp > Date.now());
  } catch {
    return false;
  }
}

export async function hasValidAdminCaptchaCookie(): Promise<boolean> {
  if (!isTurnstileConfigured()) return true;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_CAPTCHA_COOKIE)?.value;
  return verifyAdminCaptchaToken(token);
}

export async function hasValidAdminCaptchaFromRequest(
  request: NextRequest,
): Promise<boolean> {
  if (!isTurnstileConfigured()) return true;
  const token = request.cookies.get(ADMIN_CAPTCHA_COOKIE)?.value;
  return verifyAdminCaptchaToken(token);
}

export function setAdminCaptchaCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_CAPTCHA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_CAPTCHA_MAX_AGE_SEC,
  });
}

/** Block login APIs when captcha cookie is missing (production Turnstile only). */
export async function requireAdminCaptchaPass(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (!isTurnstileConfigured()) return null;

  const ok = await hasValidAdminCaptchaFromRequest(request);
  if (ok) return null;

  return NextResponse.json(
    {
      error: "Complete the security check on the sign-in page first.",
      code: "CAPTCHA_REQUIRED",
    },
    { status: 403 },
  );
}
