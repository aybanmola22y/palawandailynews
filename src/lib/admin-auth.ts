import type { SupabaseClient, User } from "@supabase/supabase-js";
import { users as seedUsers } from "@/data/users";
import type { AdminUserRow } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

/** SSR and standard clients share `from` / `auth` — avoid strict schema generics. */
export type AdminAuthClient = Pick<SupabaseClient<Database>, "from" | "auth">;

/** @deprecated Legacy dev cookie — used only when Supabase env is missing */
export const ADMIN_SESSION_COOKIE = "pdn_admin_session";
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type AdminAuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
};

export type AdminSession = AdminAuthUser & { exp: number };

function sessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "pdn-dev-session-secret-change-in-production"
  );
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSign(message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toBase64Url(new Uint8Array(sig));
}

export function mapAdminUserRow(row: AdminUserRow): AdminAuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    avatar: row.avatar || row.name.slice(0, 2).toUpperCase(),
  };
}

export function resolveAdminProfileFromSeed(email: string): AdminAuthUser {
  const normalized = email.trim().toLowerCase();
  const match = seedUsers.find((u) => u.email.toLowerCase() === normalized);
  if (match) {
    return {
      id: match.id,
      email: match.email,
      name: match.name,
      role: match.role,
      avatar: match.avatar,
    };
  }
  const local = normalized.split("@")[0] ?? "Admin";
  const name = local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return {
    id: "legacy",
    email: normalized,
    name: name || "Admin User",
    role: "Editor",
    avatar: name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
}

function displayNameFromAuthUser(authUser: User): string {
  const meta = authUser.user_metadata ?? {};
  const metaName =
    typeof meta.name === "string" ? meta.name.trim() : "";
  if (metaName) return metaName;

  const local = authUser.email?.split("@")[0] ?? "Admin";
  return local
    .replace(/[._-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function roleFromAuthUser(authUser: User): string {
  const candidate =
    typeof authUser.user_metadata?.role === "string"
      ? authUser.user_metadata.role.trim()
      : "";
  if (
    candidate === "Super Admin" ||
    candidate === "Editor" ||
    candidate === "Writer" ||
    candidate === "Moderator"
  ) {
    return candidate;
  }
  return "Writer";
}

function adminRowIdForAuthUser(authUserId: string) {
  return `U-${authUserId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/**
 * Ensure a CMS row exists for a Supabase Auth user (service role).
 * Used when migration 009 has not run yet or the user was added only in Auth.
 */
export async function ensureAdminUserForAuthUser(
  authUser: User,
): Promise<AdminUserRow | null> {
  const service = getSupabaseServiceClient();
  const email = authUser.email?.trim().toLowerCase();
  if (!service || !email) return null;

  const { data: byAuth } = await service
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (byAuth) return byAuth;

  const { data: byEmail } = await service
    .from("admin_users")
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  if (byEmail) {
    if (!byEmail.auth_user_id) {
      const { data: linked, error } = await service
        .from("admin_users")
        .update({
          auth_user_id: authUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", byEmail.id)
        .select("*")
        .single();
      if (error) return byEmail;
      return linked;
    }
    return byEmail;
  }

  const name = displayNameFromAuthUser(authUser);
  const role = roleFromAuthUser(authUser) as AdminUserRow["role"];
  const avatar =
    (typeof authUser.user_metadata?.avatar === "string" &&
      authUser.user_metadata.avatar.trim()) ||
    name
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "AD";

  const { data: created, error } = await service
    .from("admin_users")
    .insert({
      id: adminRowIdForAuthUser(authUser.id),
      auth_user_id: authUser.id,
      name,
      email,
      role,
      last_active: "Just now",
      avatar,
      profile_title: role,
      quote: "",
      bio: `${name} is a member of the Palawan Daily News editorial team.`,
      badge_label: "Palawan",
    })
    .select("*")
    .single();

  if (error) {
    console.error("[admin-auth] ensureAdminUserForAuthUser:", error.message);
    return null;
  }

  return created;
}

export type AdminLoginFailureHint = {
  message: string;
  status: number;
};

/** Actionable login errors instead of a generic invalid-credentials message. */
export async function diagnoseAdminLoginFailure(
  email: string,
): Promise<AdminLoginFailureHint> {
  const normalized = email.trim().toLowerCase();
  const service = getSupabaseServiceClient();

  if (!service) {
    return {
      message: "Invalid email or password.",
      status: 401,
    };
  }

  const { data: adminRow } = await service
    .from("admin_users")
    .select("id, email")
    .ilike("email", normalized)
    .maybeSingle();

  const { data: listData } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const authUser = listData?.users?.find(
    (u) => u.email?.trim().toLowerCase() === normalized,
  );

  const projectRef =
    getSupabaseUrl()?.match(/https:\/\/([^.]+)\.supabase\.co/i)?.[1] ?? null;
  const projectHint = projectRef
    ? ` This app uses Supabase project “${projectRef}” — add the user there (Authentication → Users), not a different project.`
    : "";

  if (!authUser) {
    if (adminRow) {
      return {
        message:
          "This email is in admin_users but not in Supabase Auth. Add them with Authentication → Users → Add user (same project as your .env)." +
          projectHint,
        status: 401,
      };
    }
    return {
      message:
        "No Auth account for this email. In Supabase open Authentication → Users → Add user, check Auto Confirm, then sign in with that exact email and password." +
        projectHint,
      status: 401,
    };
  }

  if (!authUser.email_confirmed_at) {
    return {
      message:
        "Your account email is not confirmed yet. In Supabase Dashboard → Authentication → Users, open your user and enable “Auto Confirm”, or run seed-admin-auth to create a confirmed user.",
      status: 401,
    };
  }

  return {
    message:
      "Incorrect password. Use the password set in Supabase → Authentication → Users, or reset it with: npm run seed-admin-auth -- " +
      normalized +
      " NewPassword",
    status: 401,
  };
}

async function linkAuthUserId(adminId: string, authUserId: string) {
  const service = getSupabaseServiceClient();
  if (!service) return;
  await service
    .from("admin_users")
    .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
    .eq("id", adminId);
}

async function touchLastActive(adminId: string) {
  const service = getSupabaseServiceClient();
  if (!service) return;
  await service
    .from("admin_users")
    .update({ last_active: "Just now", updated_at: new Date().toISOString() })
    .eq("id", adminId);
}

async function findAdminUserRow(supabase: AdminAuthClient, authUser: User) {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) return null;

  const { data: byAuth } = await supabase
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (byAuth) return byAuth;

  const { data: byEmail } = await supabase
    .from("admin_users")
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  return byEmail;
}

/** Fast check for middleware — does not update last_active. */
export async function isAuthorizedAdminUser(
  supabase: AdminAuthClient,
  authUser: User,
): Promise<boolean> {
  return Boolean(await findAdminUserRow(supabase, authUser));
}

/**
 * Resolve CMS profile for a Supabase Auth user.
 * Matches `admin_users.auth_user_id`, then email (auto-links auth_user_id).
 */
export async function fetchAdminProfileForAuthUser(
  supabase: AdminAuthClient,
  authUser: User,
): Promise<AdminAuthUser | null> {
  let row = await findAdminUserRow(supabase, authUser);
  if (!row) {
    row = await ensureAdminUserForAuthUser(authUser);
    if (!row) return null;
  }

  if (!row.auth_user_id) {
    await linkAuthUserId(row.id, authUser.id);
  }

  await touchLastActive(row.id);
  return mapAdminUserRow({
    ...row,
    auth_user_id: row.auth_user_id ?? authUser.id,
  });
}

/* Legacy env login (no Supabase Auth) */

export function getAdminCredentials() {
  const email = (
    process.env.ADMIN_EMAIL ?? "elena@palawandaily.com"
  ).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "palawan-admin";
  return { email, password };
}

export function credentialsAreValid(email: string, password: string) {
  const { email: expectedEmail, password: expectedPassword } =
    getAdminCredentials();
  return (
    email.trim().toLowerCase() === expectedEmail &&
    password === expectedPassword
  );
}

export async function createLegacySessionToken(
  profile: AdminAuthUser,
): Promise<string> {
  const payload: AdminSession = {
    ...profile,
    exp: Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSign(body);
  return `${body}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<AdminSession | null> {
  if (!token?.includes(".")) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = await hmacSign(body);
  if (signature.length !== expected.length) return null;

  let valid = true;
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] !== expected[i]) valid = false;
  }
  if (!valid) return null;

  try {
    const json = new TextDecoder().decode(fromBase64Url(body));
    const session = JSON.parse(json) as AdminSession;
    if (!session.email || !session.exp || session.exp < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function useSupabaseAdminAuth() {
  return isSupabaseConfigured();
}
