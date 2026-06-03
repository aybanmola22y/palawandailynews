import { NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import { getVerifiedTotpFactor } from "@/lib/admin-mfa";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

export async function GET() {
  const auth = await requireAdminRouteAuth({ allowBeforeMfaEnrolled: true });
  if (auth instanceof NextResponse) return auth;

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ enrolled: false, canEnroll: false });
  }

  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const verified = getVerifiedTotpFactor(factors);
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  return NextResponse.json({
    enrolled: Boolean(verified),
    factorId: verified?.id ?? null,
    friendlyName: verified?.friendly_name ?? null,
    currentLevel: aal?.currentLevel ?? null,
    nextLevel: aal?.nextLevel ?? null,
    canEnroll: !verified,
  });
}
