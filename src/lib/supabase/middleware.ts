import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";
import {
  ADMIN_SESSION_COOKIE,
  ensureAdminUserForAuthUser,
  isAuthorizedAdminUser,
  verifySessionToken,
} from "@/lib/admin-auth";
import { adminNeedsMfaChallenge } from "@/lib/admin-mfa";

function legacyCookieSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function updateAdminSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";

  if (!isSupabaseConfigured()) {
    const session = await legacyCookieSession(request);
    if (isLoginPage) {
      if (session) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      if (pathname !== "/admin") {
        loginUrl.searchParams.set("next", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });
  const url = getSupabaseUrl()!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[],
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isLoginPage) {
    if (user) {
      const needsMfa = await adminNeedsMfaChallenge(supabase);
      if (!needsMfa) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("step", "mfa");
      if (request.nextUrl.searchParams.get("step") !== "mfa") {
        return NextResponse.redirect(loginUrl);
      }
    }
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    if (pathname !== "/admin") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  let authorized = await isAuthorizedAdminUser(supabase, user);
  if (!authorized) {
    const provisioned = await ensureAdminUserForAuthUser(user);
    authorized = Boolean(provisioned);
  }
  if (!authorized) {
    await supabase.auth.signOut();
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(loginUrl);
  }

  const needsMfa = await adminNeedsMfaChallenge(supabase);
  if (needsMfa) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("step", "mfa");
    if (pathname !== "/admin/login") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
