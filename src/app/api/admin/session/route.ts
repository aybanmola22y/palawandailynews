import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  fetchAdminProfileForAuthUser,
  verifySessionToken,
  useSupabaseAdminAuth,
} from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

export async function GET() {
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
            return NextResponse.json({ user: profile });
          }
          return NextResponse.json({ user: null }, { status: 403 });
        }
      }
      // If Supabase auth is unavailable, fall back to legacy cookie session.
    } catch {
      // Fall back below.
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      avatar: session.avatar,
    },
  });
}
