import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type MfaClient = Pick<SupabaseClient<Database>, "auth">;

export type AdminMfaChallenge = {
  factorId: string;
  challengeId: string;
};

/** Label shown in authenticator apps (QR issuer). Not tied to Supabase Site URL. */
export function getAdminMfaTotpIssuer(): string {
  const custom = process.env.ADMIN_MFA_TOTP_ISSUER?.trim();
  if (custom) return custom;
  return "Palawan Daily News";
}

export function getVerifiedTotpFactor(
  factors: Awaited<
    ReturnType<MfaClient["auth"]["mfa"]["listFactors"]>
  >["data"],
) {
  return factors?.totp?.find((f) => f.status === "verified") ?? null;
}

/** Drop abandoned setup attempts so enroll can be retried. */
export async function clearUnverifiedTotpFactors(
  supabase: MfaClient,
): Promise<void> {
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const pending =
    factors?.totp?.filter((f) => f.status !== "verified") ?? [];
  for (const factor of pending) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
}

export async function adminHasVerifiedTotpEnrolled(
  supabase: MfaClient,
): Promise<boolean> {
  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error) return false;
  return Boolean(getVerifiedTotpFactor(factors));
}

/** No authenticator enrolled yet — must visit Security before using the CMS. */
export async function adminMustEnrollMfa(supabase: MfaClient): Promise<boolean> {
  return !(await adminHasVerifiedTotpEnrolled(supabase));
}

/** Full admin access: enrolled + verified code this session (AAL2). */
export async function adminMeetsMfaPolicy(supabase: MfaClient): Promise<boolean> {
  if (!(await adminHasVerifiedTotpEnrolled(supabase))) return false;
  const { data: aal, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !aal) return false;
  return aal.currentLevel === "aal2";
}

/** True when the user has TOTP enrolled and must verify a code to reach AAL2. */
export async function adminNeedsMfaChallenge(
  supabase: MfaClient,
): Promise<boolean> {
  const { data: factors, error: factorsError } =
    await supabase.auth.mfa.listFactors();
  if (factorsError) return false;

  const totp = getVerifiedTotpFactor(factors);
  if (!totp) return false;

  const { data: aal, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || !aal) return false;

  return aal.nextLevel === "aal2" && aal.currentLevel !== "aal2";
}

export async function startAdminMfaChallenge(
  supabase: MfaClient,
): Promise<AdminMfaChallenge | null> {
  const { data: factors, error: factorsError } =
    await supabase.auth.mfa.listFactors();
  if (factorsError) return null;

  const totp = getVerifiedTotpFactor(factors);
  if (!totp) return null;

  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId: totp.id });
  if (challengeError || !challenge?.id) return null;

  return { factorId: totp.id, challengeId: challenge.id };
}

export async function verifyAdminMfaCode(
  supabase: MfaClient,
  input: AdminMfaChallenge & { code: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const code = input.code.replace(/\D/g, "").trim();
  if (code.length !== 6) {
    return { ok: false, message: "Enter the 6-digit code from your authenticator app." };
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId: input.factorId,
    challengeId: input.challengeId,
    code,
  });

  if (error) {
    return {
      ok: false,
      message: error.message.includes("Invalid")
        ? "Invalid code. Check your authenticator app and try again."
        : error.message,
    };
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    return { ok: false, message: "Verification failed. Please try again." };
  }

  return { ok: true };
}
