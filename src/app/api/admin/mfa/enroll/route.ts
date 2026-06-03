import { NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import { getVerifiedTotpFactor } from "@/lib/admin-mfa";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

export async function POST() {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase Auth is not available." },
      { status: 503 },
    );
  }

  const { data: existing } = await supabase.auth.mfa.listFactors();
  if (getVerifiedTotpFactor(existing)) {
    return NextResponse.json(
      { error: "Authenticator is already set up for this account." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Palawan Daily News Admin",
  });

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not start authenticator setup." },
      { status: 500 },
    );
  }

  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId: data.id });
  if (challengeError || !challenge?.id) {
    return NextResponse.json(
      { error: challengeError?.message ?? "Could not create setup challenge." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    factorId: data.id,
    challengeId: challenge.id,
    qrCode: data.totp?.qr_code ?? null,
    secret: data.totp?.secret ?? null,
  });
}
