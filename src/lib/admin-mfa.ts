import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type MfaClient = Pick<SupabaseClient<Database>, "auth">;

export type AdminMfaChallenge = {
  factorId: string;
  challengeId: string;
};

export function getVerifiedTotpFactor(
  factors: Awaited<
    ReturnType<MfaClient["auth"]["mfa"]["listFactors"]>
  >["data"],
) {
  return factors?.totp?.find((f) => f.status === "verified") ?? null;
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
