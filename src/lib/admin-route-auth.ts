import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AdminAuthUser } from "@/lib/admin-auth";
import {
  ADMIN_SESSION_COOKIE,
  fetchAdminProfileForAuthUser,
  useSupabaseAdminAuth,
  verifySessionToken,
} from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export type AdminRouteAuth = {
  user: AdminAuthUser;
  service: NonNullable<ReturnType<typeof getSupabaseServiceClient>>;
};

/** Require a signed-in CMS user and service-role Supabase client for admin APIs. */
export async function requireAdminRouteAuth(): Promise<
  AdminRouteAuth | NextResponse
> {
  const service = getSupabaseServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  if (useSupabaseAdminAuth()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 503 },
      );
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await fetchAdminProfileForAuthUser(supabase, authUser);
    if (!profile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return { user: profile, service };
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
