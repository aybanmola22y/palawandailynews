import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AdminAuthUser } from "@/lib/admin-auth";
import {
  ADMIN_SESSION_COOKIE,
  fetchAdminProfileForAuthUser,
  useSupabaseAdminAuth,
  verifySessionToken,
} from "@/lib/admin-auth";
import { adminMeetsMfaPolicy, adminMustEnrollMfa } from "@/lib/admin-mfa";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export type AdminRouteAuth = {
  user: AdminAuthUser;
  service: NonNullable<ReturnType<typeof getSupabaseServiceClient>>;
};

export type RequireAdminRouteAuthOptions = {
  /** MFA setup/status routes — password sign-in only, enrollment not required yet. */
  allowBeforeMfaEnrolled?: boolean;
};

/** Require a signed-in CMS user and service-role Supabase client for admin APIs. */
export async function requireAdminRouteAuth(
  options: RequireAdminRouteAuthOptions = {},
): Promise<AdminRouteAuth | NextResponse> {
  const service = getSupabaseServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  if (useSupabaseAdminAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const profile = await fetchAdminProfileForAuthUser(supabase, authUser);
          if (profile) {
            if (!options.allowBeforeMfaEnrolled) {
              if (await adminMustEnrollMfa(supabase)) {
                return NextResponse.json(
                  {
                    error:
                      "Authenticator app setup is required. Open Admin → Security to continue.",
                    code: "MFA_ENROLLMENT_REQUIRED",
                  },
                  { status: 403 },
                );
              }
              if (!(await adminMeetsMfaPolicy(supabase))) {
                return NextResponse.json(
                  {
                    error:
                      "Enter your authenticator code to sign in again before using this action.",
                    code: "MFA_CHALLENGE_REQUIRED",
                  },
                  { status: 403 },
                );
              }
            }
            return { user: profile, service };
          }
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
      // Fall through to cookie session auth if Supabase Auth is unavailable
      // (network timeout) or no user session exists.
    } catch {
      // Fall back to cookie session auth on transient Supabase outages.
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return {
    user: {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      avatar: session.avatar,
    },
    service,
  };
}
