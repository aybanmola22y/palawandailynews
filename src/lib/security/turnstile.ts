export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() &&
      process.env.TURNSTILE_SECRET_KEY?.trim(),
  );
}

export function getTurnstileSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return key || null;
}

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

/** Server-side verification of Cloudflare Turnstile token. */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: false, message: "Captcha is not configured on the server." };
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, message: "Captcha verification is required." };
  }

  const body = new URLSearchParams({
    secret,
    response: trimmed,
  });
  if (remoteIp && remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      },
    );

    const data = (await res.json()) as TurnstileVerifyResponse;
    if (data.success) return { ok: true };

    const codes = data["error-codes"] ?? [];
    if (codes.includes("invalid-input-response")) {
      return {
        ok: false,
        message: "Captcha expired or already used. Please complete the check again.",
      };
    }
    if (codes.includes("timeout-or-duplicate")) {
      return {
        ok: false,
        message: "Captcha timed out. Please complete the check again.",
      };
    }
    if (codes.includes("invalid-input-secret")) {
      return {
        ok: false,
        message:
          "Server captcha secret is invalid. Check TURNSTILE_SECRET_KEY in .env / Vercel.",
      };
    }

    return {
      ok: false,
      message: "Captcha verification failed. Please try again.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not verify captcha. Check your connection and try again.",
    };
  }
}
